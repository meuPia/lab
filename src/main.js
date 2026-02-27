import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { Compartment } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

// ==========================================
// 1. CONFIGURAÇÃO DO EDITOR (CodeMirror)
// ==========================================
const initialCode = `algoritmo "MissaoWeb"
inicio
    escreva("Bem-vindo ao meuPiá no Navegador!")
fimalgoritmo`;

// Compartment permite reconfigurar extensões em tempo real (como o tema)
const themeConfig = new Compartment();

const view = new EditorView({
  state: EditorState.create({
    doc: initialCode,
    extensions: [
      basicSetup,
      python(), // Usando highlighter de Python por enquanto (bem parecido com Portugol)
      themeConfig.of(oneDark) // Inicia com tema escuro
    ]
  }),
  parent: document.getElementById("editor-container")
});

// ==========================================
// 2. CONFIGURAÇÃO DO TERMINAL (Xterm.js)
// ==========================================
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

// Redimensionamento responsivo
window.addEventListener('resize', () => fitAddon.fit());

// ==========================================
// 3. LÓGICA DE TEMA (Dark/Light Mode)
// ==========================================
const themeBtn = document.getElementById("theme-btn");
let isDark = true;

themeBtn.addEventListener("click", () => {
  isDark = !isDark;
  
  // 3.1 Atualiza Variáveis CSS do HTML
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  themeBtn.textContent = isDark ? "☀️ Tema Claro" : "🌙 Tema Escuro";
  
  // 3.2 Atualiza Tema do CodeMirror
  // Se for dark, aplica o 'oneDark'. Se for light, passamos um array vazio (usa tema claro padrão)
  view.dispatch({
    effects: themeConfig.reconfigure(isDark ? oneDark : [])
  });

  // 3.3 Atualiza Tema do Terminal
  term.options.theme = isDark 
    ? { background: '#000000', foreground: '#ffffff', cursor: '#ffffff' } 
    : { background: '#ffffff', foreground: '#333333', cursor: '#333333' };
});

// ==========================================
// 5. INICIALIZAÇÃO DO PYODIDE (WebAssembly)
// ==========================================
let pyodide;
const runBtn = document.getElementById("run-btn");
async function initPyodide() {
  term.writeln('\x1b[1;33m> Inicializando Motor meuPiá (WebAssembly)...\x1b[0m');
  
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      // CHECKPOINT 2: Redirecionando I/O
      stdout: (text) => term.writeln(text), // Tudo que for 'print' vai pro terminal
      stderr: (text) => term.writeln('\x1b[1;31m' + text + '\x1b[0m'), // Erros ficam vermelhos
      stdin: () => {
        // O navegador exige que o 'input()' do Python seja síncrono.
        // O prompt é a forma mais segura de contornar isso no client-side.
        let resposta = window.prompt("O programa está solicitando uma entrada de dados:");
        return resposta !== null ? resposta + "\n" : "\n";
      }
    });
    
    // CHECKPOINT 3: Instalando o meupia-core do PyPI oficial!
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

// Inicia o processo assim que a página carrega
initPyodide();

// ==========================================
// 4. BOTÃO DE EXECUÇÃO
// ==========================================
runBtn.addEventListener("click", async () => {
  if (!pyodide) return;
  
  const codigoPortugol = view.state.doc.toString();
  term.write('\r\n\x1b[1;34m[COMPILANDO]\x1b[0m\r\n');
  
  try {
    pyodide.globals.set("codigo_portugol", codigoPortugol);
    
    // ATENÇÃO: Mudamos para meuPia (com P maiúsculo)
    await pyodide.runPythonAsync(`
import os
from meuPia.compiler import main 

os.makedirs("output", exist_ok=True)

with open("main.por", "w", encoding="utf-8") as f:
    f.write(codigo_portugol)

main("main.por", "output")

with open("output/main.py", "r", encoding="utf-8") as f:
    codigo_python_gerado = f.read()

print("\\033[1;32m[EXECUTANDO]\\033[0m")
exec(codigo_python_gerado, globals())
    `);
    
    term.write('\r\n\x1b[1;32m[FIM DO PROGRAMA]\x1b[0m\r\n');
  } catch (err) {
    // AGORA SIM VAMOS VER O ERRO REAL:
    term.writeln(`\r\n\x1b[1;31m[ERRO DO SISTEMA]\x1b[0m`);
    term.writeln(err.toString());
  }
});