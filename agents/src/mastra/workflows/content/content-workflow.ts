import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { archiveStep } from "./steps/08-archive";
import { factCheckStep } from "./steps/04-fact-check";
import { humanApprovalStep } from "./steps/06-human-approval";
import { publishStep } from "./steps/07-publish";
import { researchTopicStep } from "./steps/01-research-topic";
import { reviewDraftStep } from "./steps/05-review-draft";
import { searchSourcesStep } from "./steps/02-search-sources";
import { branchOutputSchema } from "./steps/shared";
import { writeDraftStep } from "./steps/03-write-draft";

// contentWorkflow — exemplo de referência (RAG - research agent) evoluído com RAG dinâmico.
// Pipeline:
//   tópico → research-topic (Firecrawl + indexação dinâmica)
//          → search-sources (RAG no índice recém-populado)
//          → (writer ∥ fact-check) → merge → editor → aprovação humana → publicar|arquivar
//
// Quatro primitivos:
//   .then       — sequência determinística
//   .parallel   — writer e fact-check rodam simultaneamente
//   .map        — reshape entre steps (merge paralelo, flatten do branch)
//   .branch     — decisão baseada em `approved`
//
// Padrões híbridos:
//   padrão 2 — createStep(researchTopicTool): reaproveita a tool do agente como step.
//   padrão 1 — agent.generate() dentro do execute dos steps de draft/fact-check/review.
//
// Suspend/resume: humanApprovalStep pausa até receber
// { approved, reviewer } pelo Studio.
export const contentWorkflow = createWorkflow({
    id: "content-generation",
    inputSchema: z.object({
        topic: z.string(),
    }),
    outputSchema: branchOutputSchema,
    retryConfig: { attempts: 3, delay: 1000 },
})
    // 1. Pesquisa dinâmica + indexação (Firecrawl search + cache + upsert).
    //    Substitui o corpus estático: antes de perguntar, o workflow garante que o índice
    //    tenha material sobre o tópico.
    .then(researchTopicStep)
    // 2. Reshape: searchSourcesStep só precisa do `topic`, descarta a lista `indexed`.
    .map(async ({ inputData }) => ({ topic: inputData.topic }))
    // 3. RAG: busca os trechos mais relevantes dos papers indexados.
    .then(searchSourcesStep)
    // 4. Escrita + fact-check em paralelo.
    .parallel([writeDraftStep, factCheckStep])
    // 5. Merge dos dois outputs paralelos em um único input para o editor.
    .map(async ({ inputData }) => ({
        topic: inputData["write-draft"].topic,
        draft: inputData["write-draft"].draft,
        sources: inputData["write-draft"].sources,
        report: inputData["fact-check"].report,
    }))
    // 6. Editor revisa aplicando o relatório do fact-check.
    .then(reviewDraftStep)
    // 7. Pausa até o reviewer humano aprovar/rejeitar.
    .then(humanApprovalStep)
    // 8. Branch final: publica no workspace se aprovado, arquiva caso contrário.
    .branch([
        [async ({ inputData }) => inputData.approved, publishStep],
        [async ({ inputData }) => !inputData.approved, archiveStep],
    ])
    // 9. Achata o output do branch — apenas um dos ramos terá valor — para a saída do workflow.
    .map(async ({ inputData }) => {
        const result = inputData["publish"] ?? inputData["archive"];

        if (!result) {
            throw new Error("Nenhum dos ramos (publish/archive) retornou um resultado.");
        }

        return result;
    })
    .commit();
