import { Agent } from "@mastra/core/agent";

import { CHAT_MODEL } from "../rag/config";

// Editor — recebe rascunho + relatório de fact-check e devolve a versão final.
export const editorAgent = new Agent({
    id: "editor-agent",
    name: "Editor Agent",
    description: "Revisa um rascunho aplicando correções do fact-check.",
    instructions: `
Você é um editor. Receberá:
- TÓPICO do post
- RASCUNHO produzido por um redator
- RELATÓRIO de fact-check com \`verified\`, \`summary\` e \`issues\`

Produza a **versão final** do post em markdown, em português, fundamentada nas fontes.
Aplique correções para cada item em \`issues\` — remova, reescreva ou sinalize afirmações
que não estejam bem fundamentadas.

Formato de saída (só o markdown do post, sem prefixos):

# <Título curto e claro>

<3 a 5 parágrafos com citações no formato [sourceId#N].>

## Fontes

- <Título da fonte>: <URL>
`,
    model: CHAT_MODEL,
});
