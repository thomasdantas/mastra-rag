import { join } from "node:path";

import { PROJECT_ROOT } from "../lib/project-root";

export const CHAT_MODEL = "openai/gpt-5.4-nano";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const SOURCES_INDEX_NAME = "research_sources";

export const DATA_DIR = join(PROJECT_ROOT, ".data");

export const CHUNKING_CONFIG = {
    strategy: "recursive" as const,
    maxSize: 2000,
    overlap: 200,
};
