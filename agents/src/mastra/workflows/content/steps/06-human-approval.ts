import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { factCheckReportSchema } from "./04-fact-check";

// Step 4 — aprovação humana.
// Na primeira execução, o step não tem `resumeData` e chama `suspend()` — o workflow pausa.
// O Mastra persiste o snapshot; o Studio mostra um formulário com `suspendSchema` e permite
// enviar o `resumeSchema` para continuar. O workflow retoma do ponto exato.
export const humanApprovalStep = createStep({
    id: "human-approval",
    inputSchema: z.object({
        topic: z.string(),
        finalText: z.string(),
        report: factCheckReportSchema,
    }),
    suspendSchema: z.object({
        // O que o reviewer humano precisa ver antes de decidir.
        topic: z.string(),
        preview: z.string(),
        factCheck: factCheckReportSchema,
    }),
    resumeSchema: z.object({
        approved: z.boolean(),
        reviewer: z.string(),
    }),
    outputSchema: z.object({
        topic: z.string(),
        finalText: z.string(),
        approved: z.boolean(),
        reviewer: z.string(),
    }),
    execute: async ({ inputData, resumeData, suspend }) => {
        if (!resumeData) {
            return await suspend({
                topic: inputData.topic,
                preview: inputData.finalText,
                factCheck: inputData.report,
            });
        }

        return {
            topic: inputData.topic,
            finalText: inputData.finalText,
            approved: resumeData.approved,
            reviewer: resumeData.reviewer,
        };
    },
});
