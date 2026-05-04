import { createVectorQueryTool } from "@mastra/rag";

import { SOURCES_INDEX_NAME } from "../rag/config";
import { embedder } from "../rag/vector-store";

export type SearchSource = {
  id: string;
  score: number;
  metadata?: {
    citation?: string;
    sourceId?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    chunkIndex?: number;
    text?: string;
  };
};

export type SearchResult = {
  relevantContext: Array<SearchSource["metadata"]>;
  sources: SearchSource[];
};

// O agente chama essa ferramenta para encontrar os chunks mais relevantes
// para a pergunta do usuário — é o "R" (Retrieval) do RAG.
// `vectorStoreName` precisa bater com a chave registrada em new Mastra({ vectors }).
export const searchSourcesTool = createVectorQueryTool({
  id: "search-sources",
  description:
    "Busca no índice vetorial os trechos mais relevantes das fontes (papers, blogs, docs) para a pergunta. Retorna texto + citação.",
  vectorStoreName: "sources",
  indexName: SOURCES_INDEX_NAME,
  model: embedder,
  includeSources: true,
});
