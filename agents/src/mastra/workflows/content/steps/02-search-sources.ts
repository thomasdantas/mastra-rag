import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { searchSourcesTool, type SearchResult } from "../../../tools/search-sources";

// Schema de uma fonte recuperada — reutilizado pelos steps de draft/fact-check/review.
// Exportado para manter as validações dos steps seguintes consistentes.
export const sourceSchema = z.object({
    citation: z.string(),
    text: z.string(),
    sourceTitle: z.string(),
    sourceUrl: z.string(),
});

// Quantos chunks retornar no retrieval. Mantemos fixo e pequeno para o exemplo.
const SEARCH_TOP_K = 5;

// Step 2 — RAG.
// Busca os trechos mais relevantes das fontes indexadas para o tópico.
// Reutiliza a mesma `searchSourcesTool` que o `research-agent` usa.
export const searchSourcesStep = createStep({
    id: "search-sources",
    inputSchema: z.object({
        topic: z.string(),
    }),
    outputSchema: z.object({
        topic: z.string(),
        sources: z.array(sourceSchema),
    }),
    execute: async ({ inputData, mastra }) => {
        const result = (await searchSourcesTool.execute?.(
            {
                queryText: inputData.topic,
                topK: SEARCH_TOP_K,
            },
            { mastra }
        )) as SearchResult | undefined;

        // Mesmo sem resultados, seguimos adiante — o fact-check sinalizará falta de embasamento.
        const rawSources = result?.sources ?? [];

        // Normaliza para o shape validado — descarta hits sem metadados mínimos.
        const sources = rawSources
            .filter(source => source.metadata?.text && source.metadata.citation)
            .map(source => ({
                citation: source.metadata?.citation ?? "",
                text: source.metadata?.text ?? "",
                sourceTitle: source.metadata?.sourceTitle ?? "Unknown source",
                sourceUrl: source.metadata?.sourceUrl ?? "",
            }));

        return {
            topic: inputData.topic,
            sources,
        };
    },
});
