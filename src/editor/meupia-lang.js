import { StreamLanguage } from "@codemirror/language";
import { completeFromList, snippetCompletion } from "@codemirror/autocomplete";
import { StateField, StateEffect } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";

const meuPiaKeywords = [
    "algoritmo", "var", "inicio", "fim_algoritmo", "se", "entao", "então", "senao", "senão",
    "fim_se", "enquanto", "faca", "faça", "fim_enquanto", "para", "de", "ate", "até", "retorne",
    "passo", "fim_para", "escreva", "leia", "usar", "e", "ou", "nao", "não", "interrompa", "continue",
    "classe", "metodo", "funcao", "função", "fim_funcao", "fim_função", "novo", "fim_classe", "mod"
];

// Comparados em minúsculas: "filaprioridade" corresponde a filaPrioridade.
const meuPiaTypes = [
    "inteiro", "real", "float", "string", "cadeia", "logico",
    "lista", "dicionario", "filaprioridade"
];

const meuPiaAtoms = ["verdadeiro", "falso", "pi"];

export const meuPiaLanguage = StreamLanguage.define({
    token(stream, state) {
        if (stream.eatSpace()) return null;

        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }

        if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";
        if (stream.match(/^[0-9]+(?:\.[0-9]+)?/)) return "number";
        if (stream.match(/^(?:<-|<>|<=|>=|==|!=|[+\-*/%=<>])/)) return "operator";

        if (stream.match(/^[\wÀ-ú]+/)) {
            let word = stream.current().toLowerCase();
            if (meuPiaKeywords.includes(word)) return "keyword";
            if (meuPiaTypes.includes(word)) return "typeName";
            if (meuPiaAtoms.includes(word)) return "atom";
            return "variableName";
        }

        stream.next();
        return null;
    }
});

const meuPiaSnippets = [
    snippetCompletion("se ${condicao} entao\n    ${}\nfim_se", {
        label: "se",
        detail: "bloco condicional",
        type: "keyword"
    }),
    snippetCompletion("funcao ${nome}(${parametros})\n    ${}\nfim_funcao", {
        label: "funcao",
        detail: "declaração de função",
        type: "keyword"
    }),
    snippetCompletion("metodo ${nome}(${parametros})\n    ${}\nfim_funcao", {
        label: "metodo",
        detail: "declaração de método",
        type: "keyword"
    }),
    snippetCompletion("para ${variavel} de ${inicio} ate ${fim} faca\n    ${}\nfim_para", {
        label: "para",
        detail: "laço de repetição",
        type: "keyword"
    }),
    snippetCompletion("enquanto ${condicao} faca\n    ${}\nfim_enquanto", {
        label: "enquanto",
        detail: "laço de repetição",
        type: "keyword"
    }),
    snippetCompletion("classe ${Nome}\n    ${}\nfim_classe", {
        label: "classe",
        detail: "declaração de classe",
        type: "keyword"
    }),
    snippetCompletion("escreva(${})", {
        label: "escreva",
        detail: "saída no terminal",
        type: "keyword"
    }),
    snippetCompletion("leia(${variavel})", {
        label: "leia",
        detail: "entrada de dados",
        type: "keyword"
    })
];

export const meuPiaAutocompletion = meuPiaLanguage.data.of({
    autocomplete: completeFromList(meuPiaSnippets)
});

// --- Marcação do último erro de compilação ---

const definirErro = StateEffect.define();

function construirDecoracoes(doc, erro) {
    if (!erro) return Decoration.none;

    const numeroLinha = Math.min(Math.max(erro.linha, 1), doc.lines);
    const linha = doc.line(numeroLinha);
    const decoracoes = [Decoration.line({ class: "cm-linha-erro" }).range(linha.from)];

    // Linha e coluna do core começam em 1.
    const colunaValida = numeroLinha === erro.linha && erro.coluna >= 1 && erro.coluna <= linha.length;
    if (colunaValida) {
        const inicio = linha.from + erro.coluna - 1;
        const palavra = /^[\wÀ-ú]+/.exec(linha.text.slice(erro.coluna - 1));
        const fim = inicio + (palavra ? palavra[0].length : 1);
        decoracoes.push(Decoration.mark({ class: "cm-coluna-erro" }).range(inicio, fim));
    }

    return Decoration.set(decoracoes, true);
}

export const meuPiaErroCompilacao = StateField.define({
    create() {
        return Decoration.none;
    },
    update(decoracoes, tr) {
        for (const efeito of tr.effects) {
            if (efeito.is(definirErro)) return construirDecoracoes(tr.state.doc, efeito.value);
        }
        if (tr.docChanged) return Decoration.none;
        return decoracoes;
    },
    provide: (field) => EditorView.decorations.from(field)
});

export function marcarErroCompilacao(view, linha, coluna) {
    view.dispatch({ effects: definirErro.of({ linha, coluna }) });
}

export function limparErroCompilacao(view) {
    view.dispatch({ effects: definirErro.of(null) });
}
