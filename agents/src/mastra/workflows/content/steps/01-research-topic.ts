import { createStep } from "@mastra/core/workflows";

import { researchTopicTool } from "../../../tools/research-topic";

// Step 0 — pesquisa dinâmica.
// `createStep(tool)` reaproveita a mesma tool usada pelo agente —
// input/output schemas são inferidos do tool automaticamente.
// Antes de rodar o RAG (searchSourcesStep), garantimos que o índice tenha material do tópico.
// O id do step herda do tool (`research-topic`).
export const researchTopicStep = createStep(researchTopicTool);
