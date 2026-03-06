let pyodide = null;

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

        let version = "1.1.7"
        term.writeln('\x1b[1;34m> Baixando Compilador meuPiá v' + version + '...\x1b[0m');
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("meupia-core=="+version);
        await micropip.install("meupia-testes");

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

export const desafioAtual = {
    id: "soma_simples",
    titulo: "Missão: Somar Dois Números",
    instrucoes: "### Desafio\nCrie uma função chamada `somar` que receba dois parâmetros e retorne a soma deles.",
    codigoTeste: `
    esperar_igual(somar(2, 3), 5, "Soma de 2 + 3")
    esperar_igual(somar(10, 20), 30, "Soma de números negativos")
    `
};

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

    term.write('\r\n\x1b[1;34m[COMPILANDO COM DESAFIO]\x1b[0m\r\n');

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