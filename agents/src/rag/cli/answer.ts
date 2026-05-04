import type { QueryResult } from '@mastra/core/vector';

import {
  createAnswerAgent,
  createEmbeddingModel,
  createVectorStore,
  DEFAULT_TOP_K,
  RAG_INDEX_NAME,
} from './config.ts';
import type { RagChunkMetadata } from './types.ts';

export interface AskOptions {
  question: string;
  sourceUrl?: string;
  topK?: number;
}

export interface AskResult {
  answer: string;
  matches: QueryResult[];
}

export async function askRag(options: AskOptions): Promise<AskResult> {
  const vectorStore = createVectorStore();

  try {
    const embeddingModel = createEmbeddingModel();
    const embeddingResult = await embeddingModel.doEmbed({
      values: [options.question],
    });

    const matches = await vectorStore.query({
      indexName: RAG_INDEX_NAME,
      queryVector: embeddingResult.embeddings[0],
      topK: options.topK ?? DEFAULT_TOP_K,
      minScore: 0.2,
      filter: options.sourceUrl
        ? {
            sourceUrl: options.sourceUrl,
          }
        : undefined,
    });

    if (matches.length === 0) {
      return {
        answer: 'Nao encontrei contexto suficiente no RAG para responder essa pergunta.',
        matches: [],
      };
    }

    const context = matches
      .map((match, index) => {
        const metadata = (match.metadata ?? {}) as RagChunkMetadata;
        return [
          `Trecho ${index + 1}`,
          `Fonte: ${metadata.title || metadata.sourceUrl}`,
          `URL: ${metadata.sourceUrl}`,
          `Score: ${match.score.toFixed(4)}`,
          metadata.text,
        ].join('\n');
      })
      .join('\n\n---\n\n');

    const agent = createAnswerAgent();
    const result = await agent.generate(
      `
Pergunta:
${options.question}

Contexto recuperado:
${context}
`.trim(),
      {
        modelSettings: {
          temperature: 0,
          maxOutputTokens: 800,
        },
      },
    );

    return {
      answer: result.text.trim(),
      matches,
    };
  } finally {
    await vectorStore.disconnect();
  }
}
