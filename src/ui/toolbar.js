import { undo, redo } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

export function setupToolbar(view, term, themeConfig) {
    // Configuração do Input File Invisível
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".por,.txt";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Abrir Ficheiro
    document.getElementById("open-btn").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: e.target.result } });
            term.writeln(`\x1b[1;32m> Arquivo '${file.name}' carregado!\x1b[0m`);
            fileInput.value = "";
        };
        reader.readAsText(file);
    });

    // Salvar Ficheiro
    document.getElementById("save-btn").addEventListener("click", () => {
        const blob = new Blob([view.state.doc.toString()], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "meu_algoritmo.por";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        term.writeln('\x1b[1;32m> Download iniciado!\x1b[0m');
    });

    // Ações de Histórico
    document.getElementById("undo-btn").addEventListener("click", () => undo(view));
    document.getElementById("redo-btn").addEventListener("click", () => redo(view));

    // Resetar Ambiente
    document.getElementById("reset-btn").addEventListener("click", () => {
        if (confirm("Apagar todo o código e limpar o terminal?")) {
            view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } });
            term.clear();
            term.writeln('\x1b[1;32m> Ambiente redefinido.\x1b[0m\n');
        }
    });

    // Tema Claro/Escuro
    const themeBtn = document.getElementById("theme-btn");
    let isDark = true;
    themeBtn.addEventListener("click", () => {
        isDark = !isDark;
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        themeBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (window.lucide) window.lucide.createIcons();

        view.dispatch({ effects: themeConfig.reconfigure(isDark ? oneDark : []) });
        term.options.theme = isDark
            ? { background: '#000000', foreground: '#ffffff', cursor: '#ffffff' }
            : { background: '#ffffff', foreground: '#333333', cursor: '#333333' };
    });
}