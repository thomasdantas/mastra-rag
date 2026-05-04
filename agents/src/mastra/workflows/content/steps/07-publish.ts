import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { branchOutputSchema } from "./shared";

// Converte o tópico em um slug simples para nome de arquivo.
// Remove acentos, troca espaços por "-" e descarta caracteres especiais.
function slugify(topic: string) {
    return topic
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "");
}

// Step 5a — publica o post no workspace (branch "aprovado").
// Escreve em /publications/<slug>.md usando o filesystem do workspace global.
export const publishStep = createStep({
    id: "publish",
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

        const path = `publications/${slugify(inputData.topic)}.md`;

        await filesystem.mkdir("publications", { recursive: true });
        await filesystem.writeFile(
            path,
            `${inputData.finalText}\n\n---\nAprovado por: ${inputData.reviewer}\n`
        );

        return {
            status: "published" as const,
            path,
            reviewer: inputData.reviewer,
        };
    },
});
