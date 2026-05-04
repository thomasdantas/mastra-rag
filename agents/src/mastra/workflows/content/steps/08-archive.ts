import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { branchOutputSchema } from "./shared";

function slugify(topic: string) {
    return topic
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "");
}

// Step 5b — branch "rejeitado": arquiva o rascunho em /archive para revisão futura.
export const archiveStep = createStep({
    id: "archive",
    inputSchema: z.object({
        topic: z.string(),
        finalText: z.string(),
        approved: z.boolean(),
        reviewer: z.string(),
    }),
    outputSchema: branchOutputSchema,
    execute: async ({ inputData, mastra }) => {
        const workspace = mastra.getWorkspace();
        const filesystem = workspace?.filesystem;

        if (!filesystem) {
            throw new Error("Workspace filesystem não está configurado.");
        }

        const path = `archive/${slugify(inputData.topic)}.md`;

        await filesystem.mkdir("archive", { recursive: true });
        await filesystem.writeFile(
            path,
            `${inputData.finalText}\n\n---\nArquivado por: ${inputData.reviewer}\n`
        );

        return {
            status: "archived" as const,
            path,
            reviewer: inputData.reviewer,
        };
    },
});
