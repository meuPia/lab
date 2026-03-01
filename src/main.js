import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { Compartment } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { undo, redo, history } from "@codemirror/commands";

const initialCode = `algoritmo "MissaoWeb"
inicio
    escreva("Bem-vindo ao meuPiá no Navegador!")
fim_algoritmo`;

const themeConfig = new Compartment();

const meuPiaKeywords = [
  "algoritmo", "var", "inicio", "fim_algoritmo", "se", "entao", "então", "senao", "senão",
  "fim_se", "enquanto", "faca", "faça", "fim_enquanto", "para", "de", "ate", "até",
  "passo", "fim_para", "escreva", "leia", "usar", "e", "ou", "nao", "não"
];
const meuPiaTypes = ["inteiro", "string", "cadeia"];
const meuPiaAtoms = ["verdadeiro", "falso"];

const meuPiaLanguage = StreamLanguage.define({
  token(stream, state) {
    if (stream.eatSpace()) return null;

    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }

    if (stream.match(/^"[^"]*"/)) {
      return "string";
    }

    if (stream.match(/^[0-9]+/)) {
      return "number";
    }

    if (stream.match("<-") || stream.match(/^[+\-*/=<>]/)) {
      return "operator";
    }

    if (stream.match(/^[\wÀ-ú]+/)) {
      let word = stream.current().toLowerCase(); 
      
      if (meuPiaKeywords.includes(word)) return "keyword"; 
      if (meuPiaTypes.includes(word)) return "typeName";   
      if (meuPiaAtoms.includes(word)) return "atom";      
      
      return "variableName"; 
    }

    stream.next();
    return null;
  }
});

const view = new EditorView({
  state: EditorState.create({
    doc: initialCode,
    extensions: [
      basicSetup,
      meuPiaLanguage, 
      themeConfig.of(oneDark),
      history()
    ]
  }),
  parent: document.getElementById("editor-container")
});

const term = new Terminal({
  theme: { background: '#000000', foreground: '#ffffff' },
  cursorBlink: true,
  fontFamily: 'monospace',
  fontSize: 14
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById("terminal-container"));
fitAddon.fit();

term.writeln('\x1b[1;32m> Terminal meuPiá Inicializado...\x1b[0m');
term.writeln('Pronto para compilar.\n');

window.addEventListener('resize', () => fitAddon.fit());

const themeBtn = document.getElementById("theme-btn");
let isDark = true;

themeBtn.addEventListener("click", () => {
  isDark = !isDark;
  
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  
  // Troca a Lua pelo Sol dependendo do tema, e pede pro Lucide desenhar
  themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  lucide.createIcons(); 
  
  view.dispatch({
    effects: themeConfig.reconfigure(isDark ? oneDark : [])
  });

  term.options.theme = isDark 
    ? { background: '#000000', foreground: '#ffffff', cursor: '#ffffff' } 
    : { background: '#ffffff', foreground: '#333333', cursor: '#333333' };
});

let pyodide;
const runBtn = document.getElementById("run-btn");
async function initPyodide() {
  term.writeln('\x1b[1;33m> Inicializando Motor meuPiá (WebAssembly)...\x1b[0m');
  
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      stdout: (text) => term.writeln(text),
      stderr: (text) => term.writeln('\x1b[1;31m' + text + '\x1b[0m'), 
      stdin: () => {
        let resposta = window.prompt("O programa está solicitando uma entrada de dados:");
        return resposta !== null ? resposta + "\n" : "\n";
      }
    });
    
    term.writeln('\x1b[1;34m> Baixando Compilador meuPiá v1.1...\x1b[0m');
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("meupia-core==1.1.2");
    
    term.writeln('\x1b[1;32m> Ambiente 100% Pronto!\x1b[0m');
    term.writeln('====================================\n');
    
    runBtn.disabled = false;
    runBtn.innerHTML = '<i data-lucide="play"></i> Rodar';
    lucide.createIcons(); 
    
  } catch (err) {
    term.writeln('\x1b[1;31m> Falha Crítica:\x1b[0m');
    term.writeln(err.toString());
  }
}

initPyodide();

runBtn.addEventListener("click", async () => {
  if (!pyodide) return;
  
  const codigoPortugol = view.state.doc.toString();
  term.write('\r\n\x1b[1;34m[COMPILANDO]\x1b[0m\r\n');
  try {
    pyodide.globals.set("codigo_portugol", codigoPortugol);
    await pyodide.runPythonAsync(`
      import os
      import sys
      import io
      from meuPia.compiler import main 
      
      os.makedirs("output", exist_ok=True)
      
      with open("main.por", "w", encoding="utf-8") as f:
          f.write(codigo_portugol)
      
      # --- INÍCIO DO MODO SILENCIOSO ---
      stdout_original = sys.stdout # Salva o terminal real
      sys.stdout = io.StringIO()   # Redireciona os prints do compilador para o "limbo"
      
      try:
        main("main.por", "output")
      finally:
        sys.stdout = stdout_original # Devolve o terminal real, mesmo se der erro
      # --- FIM DO MODO SILENCIOSO ---
      
      with open("output/main.py", "r", encoding="utf-8") as f:
          codigo_python_gerado = f.read()
      
      print("\\033[1;32m[EXECUTANDO]\\033[0m")
      print("")
      exec(codigo_python_gerado, globals())
          `);
    
    term.write('\r\n\x1b[1;32m[FIM DO PROGRAMA]\x1b[0m\r\n');
  } catch (err) {
    term.writeln(`\r\n\x1b[1;31m[ERRO DO SISTEMA]\x1b[0m`);
    term.writeln(err.toString());
  }
});

const openBtn = document.getElementById("open-btn");
const saveBtn = document.getElementById("save-btn");
const fileInput = document.createElement("input");

fileInput.type = "file";
fileInput.accept = ".por,.txt"; 
fileInput.style.display = "none";
document.body.appendChild(fileInput);

openBtn.addEventListener("click", () => {
  fileInput.click(); 
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const conteudo = e.target.result;
    
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: conteudo }
    });
    
    term.writeln(`\x1b[1;32m> Arquivo '${file.name}' carregado com sucesso!\x1b[0m`);
    fileInput.value = ""; 
  };
  reader.readAsText(file);
});

saveBtn.addEventListener("click", () => {
  const codigo = view.state.doc.toString();
  
  const blob = new Blob([codigo], { type: "text/plain;charset=utf-8" });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "meu_algoritmo.por"; 
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  term.writeln('\x1b[1;32m> Download do arquivo iniciado!\x1b[0m');
});

document.getElementById("undo-btn").addEventListener("click", () => {
  undo(view);
});

document.getElementById("redo-btn").addEventListener("click", () => {
  redo(view);
});

document.getElementById("reset-btn").addEventListener("click", () => {
  const confirmar = confirm("Atenção: Você está prestes a apagar todo o código e limpar o terminal. Deseja continuar?");
  if (confirmar) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: "" }
    });
    term.clear();
    term.writeln('\x1b[1;32m> Ambiente redefinido.\x1b[0m\n');
  }
});