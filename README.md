# 🚀 meuPiá Lab
![cover](./assets/meuPia-lab_cover.png)

O **meuPiá Lab** é o Ambiente de Desenvolvimento Integrado (IDE) web oficial para a linguagem de programação **meuPiá**. 

Construído com foco pedagógico para o ensino de Engenharia de Software e Fundamentos de Inteligência Artificial, o Lab permite que os alunos escrevam algoritmos em Portugol (meuPiá) e os executem **100% no navegador**, sem a necessidade de instalar nada na máquina ou depender de servidores no backend.

## ✨ Funcionalidades

* 🌐 **Execução Local (WebAssembly):** Utiliza o Pyodide para rodar o compilador `meupia-core` e o código Python gerado diretamente na memória do navegador.
* 📝 **Editor Inteligente:** Integração com CodeMirror, oferecendo *Syntax Highlighting* customizado para as palavras-chave, operadores e tipos da linguagem meuPiá.
* 🖥️ **Terminal Integrado:** Emulador de terminal de alta fidelidade usando Xterm.js, exibindo logs de compilação, erros de sintaxe/semântica e a saída real do programa.
* 💾 **Gestão de Arquivos:** Capacidade de importar arquivos `.por` do computador e salvar os algoritmos desenvolvidos diretamente pelo navegador.
* 🌓 **Temas:** Suporte nativo para Modo Claro e Modo Escuro.

## 🛠️ Arquitetura e Tecnologias

O meuPiá Lab não é apenas um editor de texto; ele simula um Sistema de Arquivos Virtual (VFS) completo no frontend.

1. **Frontend:** HTML, CSS, JavaScript Vanilla, CodeMirror (Editor) e Xterm.js (Terminal).
2. **Runtime Engine:** **Pyodide** (Python compilado para WebAssembly).
3. **Compilador:** O núcleo da linguagem (`meupia-core`, disponível no PyPI) é baixado em tempo real pelo navegador via `micropip`.
4. **O Fluxo de Execução:**
   * O aluno digita o código no CodeMirror.
   * O código é salvo no VFS do Pyodide como `main.por`.
   * O compilador `meupia-core` processa o arquivo (Léxico > Sintático > Semântico > Gerador de Código).
   * O arquivo `output/main.py` é gerado no VFS.
   * O Pyodide executa o Python gerado com a função `exec()` e devolve o output para o Xterm.js.

## 🚀 Como rodar o projeto localmente

Como o projeto é um frontend estático que utiliza ES Modules, você precisa de um servidor web simples para rodá-lo (abrir o `index.html` direto no navegador com `file://` pode bloquear o carregamento dos módulos por restrições de CORS).

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado (para gerenciar os pacotes do editor e do terminal).

### Passos
1. Clone este repositório:

```bash
   git clone [https://github.com/meuPia/lab.git](https://github.com/meuPia/lab.git)
   cd lab

```

2. Instale as dependências de interface (CodeMirror e Xterm):
```bash
npm install

```


3. Inicie um servidor de desenvolvimento (você pode usar o Vite, ou um servidor embutido do Python/Node):
```bash
npx vite

```


*(Ou se preferir usar Python: `python -m http.server 5173`)*
4. Acesse `http://localhost:5173` no seu navegador.

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Sinta-se à vontade para abrir uma *Issue* para relatar bugs ou enviar um *Pull Request* com melhorias para a interface ou integração com o compilador.

Para alterações no motor da linguagem (compilador), visite o repositório oficial do [meuPiá Core](https://www.google.com/search?q=link-do-repo-core-aqui).