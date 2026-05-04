import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { LibSQLVector } from "@mastra/libsql";

import { DATA_DIR, EMBEDDING_MODEL } from "./config";

mkdirSync(DATA_DIR, { recursive: true });

export const embedder = new ModelRouterEmbeddingModel(EMBEDDING_MODEL);

export const vectorStore = new LibSQLVector({
    id: "research-rag-vector",
    url: `file:${join(DATA_DIR, "sources.db")}`,
});
