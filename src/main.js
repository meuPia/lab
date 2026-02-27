import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { Compartment } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

const initialCode = `algoritmo "MissaoWeb"
inicio
    escreva("Bem-vindo ao meuPiá no Navegador!")
fimalgoritmo`;

const themeConfig = new Compartment();

// ==========================================
// 1.5 DEFINIÇÃO DA LINGUAGEM MEUPIÁ
// ==========================================
const meuPiaKeywords = [
  "algoritmo", "var", "inicio", "fimalgoritmo", "se", "entao", "então", "senao", "senão",
  "fim_se", "enquanto", "faca", "faça", "fimenquanto", "para", "de", "ate", "até",
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
      meuPiaLanguage, // <-- TROQUE AQUI! Sai o python(), entra a nossa linguagem!
      themeConfig.of(oneDark)
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
  themeBtn.textContent = isDark ? "☀️ Tema Claro" : "🌙 Tema Escuro";
  
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
    
    term.writeln('\x1b[1;34m> Baixando Compilador meuPiá v1.0...\x1b[0m');
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("meupia-core");
    
    term.writeln('\x1b[1;32m> Ambiente 100% Pronto!\x1b[0m');
    term.writeln('====================================\n');
    
    runBtn.disabled = false;
    runBtn.textContent = "▶ Rodar Código";
    
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