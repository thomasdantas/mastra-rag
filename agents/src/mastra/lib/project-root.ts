import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Durante `mastra dev` o cwd é alterado para src/mastra/public/ (publicDir do Mastra).
// Isso quebra paths relativos ao package (workspace/, .data/, etc.).
// Esta função caminha para cima procurando o package.json mais próximo
// que NÃO seja o do bundle interno do Mastra (`.mastra/output/package.json`).
// Assim, filesystem/sandbox/indexer sempre enxergam o mesmo diretório do package.
function isPackageRoot(dir: string) {
    return existsSync(resolve(dir, "package.json"));
}

export function findProjectRoot(startFrom: string = process.cwd()): string {
    // Normaliza caminho absoluto e protege contra loop infinito.
    let current = resolve(startFrom);

    while (true) {
        // Pula o package.json do bundle do Mastra (.mastra/output/package.json).
        const isMastraOutput = current.includes(`${".mastra"}/output`);

        if (!isMastraOutput && isPackageRoot(current)) {
            return current;
        }

        const parent = dirname(current);

        // Chegou na raiz do filesystem — desiste e devolve cwd como fallback seguro.
        if (parent === current) {
            return process.cwd();
        }

        current = parent;
    }
}

// Resolvido uma única vez na inicialização do módulo — todos os imports veem o mesmo valor.
export const PROJECT_ROOT = findProjectRoot();
