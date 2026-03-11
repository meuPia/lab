import { desafioAtual } from "./desafios.js";

let pyodide = null;
let version = "1.1.20"

export const getPyodide = () => pyodide;

export async function initWasmEngine(term, runBtn) {
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

        term.writeln('\x1b[1;34m> Baixando Compilador meuPiá v' + version + '...\x1b[0m');
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("meupia-core=="+version);
        await micropip.install("meupia-testes");

        if (desafioAtual && desafioAtual.mapa) {
            term.writeln('\x1b[1;36m> Detectado Mapa 2D: Auto-instalando plugin "grid"...\x1b[0m');
            const gridUrl = "https://cdn.jsdelivr.net/gh/meuPia/grid@main/dist/meupia_grid-1.0.2-py3-none-any.whl";
            await micropip.install(gridUrl);
        }

        term.writeln('\x1b[1;32m> Ambiente 100% Pronto!\x1b[0m');
        term.writeln('====================================\n');

        runBtn.disabled = false;
        runBtn.innerHTML = '<i data-lucide="play"></i> Rodar';
        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        term.writeln('\x1b[1;31m> Falha Crítica:\x1b[0m');
        term.writeln(err.toString());
    }
}

export async function runWasmCode(view, term) {
    const pyodideInstance = getPyodide();
    if (!pyodideInstance) return;
    
    let codigoOriginal = view.state.doc.toString();
    let codigoFinal = codigoOriginal;

    if (desafioAtual && desafioAtual.codigoTeste) {
        codigoFinal = codigoOriginal.replace(/fim_algoritmo/gi, "");

        if (!codigoFinal.toLowerCase().includes('usar "testes"')) {
            const regexAlgoritmo = /(algoritmo\s+"[^"]*")/i;
            codigoFinal = codigoFinal.replace(regexAlgoritmo, '$1\nusar "testes"');
        }

        codigoFinal += `\n\n// --- TESTES AUTOMATIZADOS ---\n`;
        codigoFinal += desafioAtual.codigoTeste;
        codigoFinal += `\nfim_algoritmo`;
    }

    term.write('\r\n\x1b[1;34m[COMPILANDO' + (desafioAtual ? ' COM DESAFIO' : '') + ']\x1b[0m\r\n');

    try {
        pyodideInstance.globals.set("codigo_portugol", codigoFinal);
        
        await pyodideInstance.runPythonAsync(`
import os
import sys
import io
from meuPia.compiler import main 

os.makedirs("output", exist_ok=True)
if os.path.exists("output/main.py"):
    os.remove("output/main.py")

with open("main.por", "w", encoding="utf-8") as f:
    f.write(codigo_portugol)

stdout_original = sys.stdout 
limbo = io.StringIO()
sys.stdout = limbo   

try:
    main("main.por", "output")
finally:
    sys.stdout = stdout_original 

if not os.path.exists("output/main.py"):
    print("\\033[1;31m[ERRO DE COMPILAÇÃO]\\033[0m")
    print(limbo.getvalue())
else:
    with open("output/main.py", "r", encoding="utf-8") as f:
        codigo_python_gerado = f.read()
    
    print("\\033[1;32m[EXECUTANDO]\\033[0m")
    print("")
    
    try:
        exec(codigo_python_gerado, globals())
    except SystemExit:
        pass
        `);
        term.write('\r\n\x1b[1;32m[FIM DO PROGRAMA]\x1b[0m\r\n');
    } catch (err) {
        term.writeln(`\r\n\x1b[1;31m[ERRO DO SISTEMA]\x1b[0m`);
        term.writeln(err.toString());
    }
}