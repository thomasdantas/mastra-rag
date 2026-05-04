import { z } from "zod";

// Schema comum de saída dos dois lados do branch final (.branch).
// O branch exige que todos os ramos tenham o mesmo outputSchema para que um step seguinte
// consiga consumir o resultado de qualquer caminho.
export const branchOutputSchema = z.object({
    status: z.enum(["published", "archived"]),
    path: z.string(),
    reviewer: z.string(),
});
