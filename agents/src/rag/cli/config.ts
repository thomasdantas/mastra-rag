import { Agent } from '@mastra/core/agent';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { PgVector } from '@mastra/pg';

export const RAG_INDEX_NAME = 'rag_articles';
export const EMBEDDING_DIMENSION = 1536;
export const EMBEDDING_MODEL_ID = 'openai/text-embedding-3-small';
export const ANSWER_MODEL_ID = 'openai/gpt-5-mini';
export const DEFAULT_TOP_K = 6;

export type RequiredEnvironmentKey =
  | 'DATABASE_URL'
  | 'FIRECRAWL_API_KEY'
  | 'OPENAI_API_KEY';

export function loadEnvironment(requiredKeys: RequiredEnvironmentKey[]): void {
  try {
    process.loadEnvFile('.env');
  } catch (error) {
    const envError = error as NodeJS.ErrnoException;
    if (envError.code !== 'ENOENT') {
      throw envError;
    }
  }

  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function createVectorStore(): PgVector {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new PgVector({
    id: 'rag-pg-vector',
    connectionString,
  });
}

export async function ensureVectorIndex(vectorStore: PgVector): Promise<void> {
  const indexes = await vectorStore.listIndexes();
  if (indexes.includes(RAG_INDEX_NAME)) {
    return;
  }

  await vectorStore.createIndex({
    indexName: RAG_INDEX_NAME,
    dimension: EMBEDDING_DIMENSION,
    metric: 'cosine',
    indexConfig: {
      type: 'hnsw',
    },
    metadataIndexes: ['sourceUrl', 'documentId'],
  });
}

export function createEmbeddingModel(): ModelRouterEmbeddingModel {
  return new ModelRouterEmbeddingModel(EMBEDDING_MODEL_ID);
}

export function createAnswerAgent(): Agent {
  return new Agent({
    id: 'rag-answer-agent',
    name: 'RAG Answer Agent',
    model: ANSWER_MODEL_ID,
    instructions: `
Você responde perguntas somente com base no contexto recuperado do RAG.

Regras:
- Responda em português do Brasil.
- Use apenas o contexto fornecido.
- Se o contexto não for suficiente, diga isso explicitamente.
- Não invente fatos nem complete lacunas com suposições.
- Quando houver evidência suficiente, sintetize a resposta de forma objetiva.
`.trim(),
  });
}
