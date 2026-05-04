import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { sourceSchema } from "./02-search-sources";

// Step 2a — writer (agent.generate dentro do execute).
// Executa em paralelo com o fact-check (.parallel).
export const writeDraftStep = createStep({
    id: "write-draft",
    inputSchema: z.object({
        topic: z.string(),
        sources: z.array(sourceSchema),
    }),
    outputSchema: z.object({
        topic: z.string(),
        draft: z.string(),
        sources: z.array(sourceSchema),
    }),
    execute: async ({ inputData, mastra }) => {
        const writer = mastra.getAgent("writerAgent");

        const prompt = [
            `TÓPICO: ${inputData.topic}`,
            "",
            "FONTES:",
            ...inputData.sources.map(
                source => `- ${source.citation} (${source.sourceTitle}): ${source.text}`
            ),
            "",
            "Escreva o rascunho agora.",
        ].join("\n");

        const response = await writer.generate(prompt);

        return {
            topic: inputData.topic,
            draft: response.text,
            sources: inputData.sources,
        };
    },
});
