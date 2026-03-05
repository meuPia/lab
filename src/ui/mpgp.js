export function initPackageManager(getPyodideInstance) {
    const packagesModal = document.getElementById('packages-modal');
    const packagesBtn = document.getElementById('packages-btn');
    const closePackagesBtn = document.getElementById('close-packages-btn');
    const installButtons = document.querySelectorAll('.install-btn');
    const packageLog = document.getElementById('package-status-log');
  
    // Abrir e Fechar Modal
    packagesBtn.addEventListener('click', () => { packagesModal.classList.remove('hidden'); });
    closePackagesBtn.addEventListener('click', () => { packagesModal.classList.add('hidden'); });
    packagesModal.addEventListener('click', (e) => {
      if (e.target === packagesModal) packagesModal.classList.add('hidden');
    });
  
    // Instalação via micropip
    installButtons.forEach(btn => {
      // CORREÇÃO DO BUG AQUI: Apenas um 'async'
      btn.addEventListener('click', async (e) => {
        const pyodide = getPyodideInstance();
        if (!pyodide) {
            packageLog.style.color = "#f44336";
            packageLog.textContent = "[ERRO] O motor Wasm ainda não está pronto.";
            return;
        }

        const pluginName = e.target.getAttribute('data-plugin');
        const packageName = `meupia-${pluginName}`; 
        
        e.target.disabled = true;
        e.target.textContent = "Instalando...";
        packageLog.style.color = "#ffeb3b";
        packageLog.textContent = `[mpgp] Baixando ${packageName} do PyPI... aguarde.`;
  
        try {
          await pyodide.loadPackage("micropip");
          const micropip = pyodide.pyimport("micropip");
          await micropip.install(packageName);
          
          e.target.textContent = "Instalado";
          e.target.classList.add("installed");
          packageLog.style.color = "#4CAF50";
          packageLog.textContent = `[mpgp] Sucesso! Pacote '${pluginName}' pronto para uso.`;
          
        } catch (error) {
          e.target.disabled = false;
          e.target.textContent = "Tentar Novamente";
          packageLog.style.color = "#f44336";
          packageLog.textContent = `[mpgp] Erro ao instalar ${pluginName}: ${error.message}`;
        }
      });
    });
}