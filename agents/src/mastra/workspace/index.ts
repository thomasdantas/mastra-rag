import { join } from "node:path";

import { LocalFilesystem, LocalSandbox, Workspace } from "@mastra/core/workspace";

import { PROJECT_ROOT } from "../lib/project-root";

// Workspace global
// PROJECT_ROOT (package.json do package) em vez de process.cwd() porque o
// `mastra dev` altera o cwd para src/mastra/public/ — cwd não é confiável aqui.
const basePath = join(PROJECT_ROOT, "workspace");

export const workspace = new Workspace({
    filesystem: new LocalFilesystem({ basePath }),
    sandbox: new LocalSandbox({ workingDirectory: basePath }), // Sandbox para executar comandos de shell no workspace
    skills: ["skills"],
});
