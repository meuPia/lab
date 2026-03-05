import { StreamLanguage } from "@codemirror/language";

const meuPiaKeywords = [
    "algoritmo", "var", "inicio", "fim_algoritmo", "se", "entao", "então", "senao", "senão",
    "fim_se", "enquanto", "faca", "faça", "fim_enquanto", "para", "de", "ate", "até", "retorne",
    "passo", "fim_para", "escreva", "leia", "usar", "e", "ou", "nao", "não", "interrompa", "continue", 
    "classe", "metodo", "funcao", "função", "fim_funcao", "fim_função", "novo", "fim_classe" 
];
const meuPiaTypes = ["inteiro", "string", "cadeia"];
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