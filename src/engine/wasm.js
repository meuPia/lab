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

        term.writeln('\x1b[1;34m> Baixando Compilador meuPiá v1.1.4...\x1b[0m');
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("meupia-core==1.1.4");

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