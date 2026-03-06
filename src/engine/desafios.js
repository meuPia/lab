const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com/meuPia/desafios/main";

export let desafioAtual = null;

/**
 * Lê a URL, verifica se existe o parâmetro '?desafio=' e faz o fetch do JSON.
 * Retorna true se um desafio foi carregado, false caso contrário (Modo Free Coding).
 */
export async function carregarDesafioDaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const desafioId = urlParams.get('desafio');

    if (!desafioId) {
        console.log("[meuPiá] Modo Free Coding ativado (Sem desafio na URL).");
        desafioAtual = null;
        return false;
    }

    try {
        console.log(`[meuPiá] Buscando desafio '${desafioId}' do CDN...`);
        
        const response = await fetch(`${GITHUB_RAW_BASE_URL}/${desafioId}.json`);
        
        if (!response.ok) {
            throw new Error(`Desafio não encontrado (HTTP ${response.status})`);
        }
        
        desafioAtual = await response.json();
        console.log(`[meuPiá] Desafio '${desafioAtual.titulo}' carregado com sucesso!`);
        return true;

    } catch (error) {
        console.error("[meuPiá] Falha ao carregar o desafio:", error);
        
        desafioAtual = null;
        return false;
    }
}