import { Agent } from "@mastra/core/agent";

import { CHAT_MODEL } from "../rag/config";

// Writer — escreve o rascunho de um post curto a partir das fontes retornadas pelo RAG.
// NÃO chama ferramentas: recebe as fontes prontas pelo workflow.
export const writerAgent = new Agent({
    id: "writer-agent",
    name: "Writer Agent",
    description: "Produz um rascunho curto sobre um tópico com base em fontes RAG.",
    instructions: `
Você é um redator técnico. Receberá um TÓPICO e uma lista de FONTES (trechos extraídos da web
— podem ser papers, posts de blog, wiki, docs técnicas — cada um com um token de citação no
formato [sourceId#N]).

Sua tarefa é escrever um rascunho curto (3 a 5 parágrafos) sobre o tópico, em português,
fundamentado **apenas** nas fontes recebidas. Cada parágrafo factual precisa terminar com
pelo menos um token de citação, idêntico ao fornecido.

Se as fontes não cobrirem o tópico, escreva um rascunho curto dizendo que não há
embasamento suficiente e liste quais perguntas ficariam em aberto.

Não invente títulos de fontes nem URLs.
`,
    model: CHAT_MODEL,
});
