import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { sourceSchema } from "./02-search-sources";

export const factCheckReportSchema = z.object({
    verified: z.boolean(),
    summary: z.string(),
    issues: z.array(z.string()),
});

// Step 2b — fact-check (.parallel com o writer).
// Usa o padrão agent.generate + parse estruturado.
// Em caso de resposta inválida, degrada para verified=false para não derrubar o workflow.
export const factCheckStep = createStep({
    id: "fact-check",
    inputSchema: z.object({
        topic: z.string(),
        sources: z.array(sourceSchema),
    }),
    outputSchema: z.object({
        report: factCheckReportSchema,
    }),
    execute: async ({ inputData, mastra }) => {
        const reviewer = mastra.getAgent("factCheckAgent");

        const prompt = [
            `TÓPICO: ${inputData.topic}`,
            "",
            "FONTES:",
            ...inputData.sources.map(
                source => `- ${source.citation} (${source.sourceTitle}): ${source.text}`
            ),
            "",
            "Gere agora o JSON do relatório.",
        ].join("\n");

        const response = await reviewer.generate(prompt);

        try {
            const parsed = JSON.parse(response.text);
            return { report: factCheckReportSchema.parse(parsed) };
        } catch {
            return {
                report: {
                    verified: false,
                    summary: "Não foi possível interpretar o relatório estruturado do fact-check.",
                    issues: ["Resposta do fact-checker não é JSON válido."],
                },
            };
        }
    },
});
