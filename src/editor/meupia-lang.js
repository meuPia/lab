import { StreamLanguage } from "@codemirror/language";
import { completeFromList, snippetCompletion } from "@codemirror/autocomplete";

const meuPiaKeywords = [
    "algoritmo", "var", "inicio", "fim_algoritmo", "se", "entao", "então", "senao", "senão",
    "fim_se", "enquanto", "faca", "faça", "fim_enquanto", "para", "de", "ate", "até", "retorne",
    "passo", "fim_para", "escreva", "leia", "usar", "e", "ou", "nao", "não", "interrompa", "continue", 
    "classe", "metodo", "funcao", "função", "fim_funcao", "fim_função", "novo", "fim_classe" 
];

const meuPiaTypes = [
    "inteiro", "real", "string", "cadeia", "logico", 
    "fila", "pilha", "heap", "lista"
];

const meuPiaAtoms = ["verdadeiro", "falso"];

export const meuPiaLanguage = StreamLanguage.define({
    token(stream, state) {
        if (stream.eatSpace()) return null;

        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }

        if (stream.match(/^"[^"]*"/)) return "string";
        if (stream.match(/^[0-9]+/)) return "number";
        if (stream.match("<-") || stream.match(/^[+\-*/=<>]/)) return "operator";

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
    snippetCompletion("para ${variavel} de ${inicio} ate ${fim} passo ${1} faca\n    ${}\nfim_para", {
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
    })
];

export const meuPiaAutocompletion = meuPiaLanguage.data.of({
    autocomplete: completeFromList(meuPiaSnippets)
});