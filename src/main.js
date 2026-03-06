import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { history } from "@codemirror/commands";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { meuPiaLanguage } from "./editor/meupia-lang.js";
import { initWasmEngine, runWasmCode, getPyodide } from "./engine/wasm.js";
import { carregarDesafioDaURL, desafioAtual } from "./engine/desafios.js";
import { renderDesafio, parseTestLine } from "./ui/instructions.js";
import { setupToolbar } from "./ui/toolbar.js";
import { setupLayout } from "./ui/layout.js";
import { initPackageManager } from "./ui/mpgp.js";

const hasDesafio = await carregarDesafioDaURL();

const term = new Terminal({ 
  theme: { background: '#000000', foreground: '#ffffff' }, 
  cursorBlink: true, 
  fontSize: 14 
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById("terminal-pane"));

const originalWriteln = term.writeln.bind(term);
term.writeln = (text) => {
  originalWriteln(text);
  parseTestLine(text); 
};

window.addEventListener('resize', () => fitAddon.fit());

const themeConfig = new Compartment();
let docInicial = `algoritmo "MissaoWeb"\ninicio\n    escreva("meuPiá Lab pronto!")\nfim_algoritmo`;
if (hasDesafio) {
  if (desafioAtual.codigoInicial) {
      docInicial = desafioAtual.codigoInicial;
  } else {
      docInicial = `algoritmo "${desafioAtual.id}"\ninicio\n    // Escreva sua solução aqui\nfim_algoritmo`;
  }
}

const view = new EditorView({
  state: EditorState.create({
    doc: docInicial,
    extensions: [ 
      basicSetup, 
      meuPiaLanguage, 
      themeConfig.of(oneDark), 
      history(), 
      EditorView.lineWrapping 
    ]
  }),
  parent: document.getElementById("editor-pane")
});

setupToolbar(view, term, themeConfig);
setupLayout(term, fitAddon);
initPackageManager(getPyodide); 

if (hasDesafio) {
  renderDesafio(desafioAtual);
  if (window.setInstructions) {
      window.setInstructions(document.getElementById('test-content').innerHTML);
  }
} else {
  if (window.setInstructions) {
      window.setInstructions(""); 
  }
}

const runBtn = document.getElementById("run-btn");
initWasmEngine(term, runBtn);

runBtn.addEventListener("click", async () => {
  const resultsContainer = document.getElementById('test-results');
  if (resultsContainer) resultsContainer.innerHTML = '';
  
  await runWasmCode(view, term);
});

setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);