import { Agent } from "@mastra/core/agent";

import { CHAT_MODEL } from "../rag/config";

// Fact-check — valida se as afirmações do rascunho têm lastro nas fontes do RAG.
// É usado em paralelo com o writer (.parallel).
export const factCheckAgent = new Agent({
    id: "fact-check-agent",
    name: "Fact Check Agent",
    description: "Verifica se um rascunho está fundamentado nas fontes RAG.",
    instructions: `
Você é um revisor de fact-checking. Receberá um TÓPICO e uma lista de FONTES indexadas
(papers, blogs, wiki, docs). Sua tarefa é produzir um relatório curto e estruturado sobre o
que dá para afirmar com segurança a partir dessas fontes.

Retorne um JSON válido com este formato exato (sem markdown, sem prefixos):

{
  "verified": true | false,
  "summary": "Frase única em português dizendo o que pode ser afirmado com base nas fontes.",
  "issues": ["Lista de lacunas ou afirmações que NÃO são suportadas pelas fontes."]
}

- \`verified\` é \`true\` quando há embasamento suficiente para um rascunho factual; \`false\`
  quando as fontes não cobrem o tópico de forma adequada.
- \`issues\` pode ser \`[]\` quando não há problemas.

Seja estrito: não inclua afirmações que não apareçam explicitamente nas fontes.
`,
    model: CHAT_MODEL,
});
