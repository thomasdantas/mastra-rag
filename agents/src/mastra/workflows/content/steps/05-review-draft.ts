import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { factCheckReportSchema } from "./04-fact-check";
import { sourceSchema } from "./02-search-sources";

// Step 3 — editor revisa o draft usando o relatório de fact-check.
// Recebe os dados já achatados por um .map() após o .parallel().
export const reviewDraftStep = createStep({
    id: "review-draft",
    inputSchema: z.object({
        topic: z.string(),
        draft: z.string(),
        sources: z.array(sourceSchema),
        report: factCheckReportSchema,
    }),
    outputSchema: z.object({
        topic: z.string(),
        finalText: z.string(),
        report: factCheckReportSchema,
    }),
    execute: async ({ inputData, mastra }) => {
        const editor = mastra.getAgent("editorAgent");

        const prompt = [
            `TÓPICO: ${inputData.topic}`,
            "",
            "RASCUNHO:",
            inputData.draft,
            "",
            "RELATÓRIO DE FACT-CHECK:",
            JSON.stringify(inputData.report, null, 2),
            "",
            "FONTES DISPONÍVEIS:",
            ...inputData.sources.map(s => `- ${s.citation} — ${s.sourceTitle} (${s.sourceUrl})`),
            "",
            "Produza agora a versão final do post em markdown.",
        ].join("\n");

        const response = await editor.generate(prompt);

        return {
            topic: inputData.topic,
            finalText: response.text,
            report: inputData.report,
        };
    },
});
