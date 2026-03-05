import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { history } from "@codemirror/commands";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { meuPiaLanguage } from "./editor/meupia-lang.js";
import { initWasmEngine, runWasmCode, getPyodide } from "./engine/wasm.js";
import { setupToolbar } from "./ui/toolbar.js";
import { setupLayout } from "./ui/layout.js";
import { initPackageManager } from "./ui/mpgp.js";

const term = new Terminal({ theme: { background: '#000000', foreground: '#ffffff' }, cursorBlink: true, fontSize: 14 });
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById("terminal-pane"));
window.addEventListener('resize', () => fitAddon.fit());

const themeConfig = new Compartment();
const view = new EditorView({
  state: EditorState.create({
    doc: `algoritmo "MissaoWeb"\ninicio\n    escreva("meuPiá Lab refatorado com sucesso!")\nfim_algoritmo`,
    extensions: [ basicSetup, meuPiaLanguage, themeConfig.of(oneDark), history(), EditorView.lineWrapping ]
  }),
  parent: document.getElementById("editor-pane")
});

setupToolbar(view, term, themeConfig);
setupLayout(term, fitAddon);
initPackageManager(getPyodide); 

const runBtn = document.getElementById("run-btn");
initWasmEngine(term, runBtn);
runBtn.addEventListener("click", () => runWasmCode(view, term));

setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);