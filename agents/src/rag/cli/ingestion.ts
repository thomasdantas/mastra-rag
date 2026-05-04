import { MDocument } from '@mastra/rag';

import { createEmbeddingModel, createVectorStore, ensureVectorIndex, RAG_INDEX_NAME } from './config.ts';
import type { RagChunkMetadata, ScrapedDocument } from './types.ts';
import { buildDocumentId } from './utils.ts';

export interface IngestResult {
  documentId: string;
  title: string;
  sourceUrl: string;
  contentType?: string;
  chunkCount: number;
}

export async function ingestScrapedDocument(document: ScrapedDocument): Promise<IngestResult> {
  const vectorStore = createVectorStore();

  try {
    await ensureVectorIndex(vectorStore);

    const mastraDocument = MDocument.fromMarkdown(document.markdown, {
      title: document.title,
      sourceUrl: document.sourceUrl,
      contentType: document.contentType,
    });

    const chunks = await mastraDocument.chunk({
      strategy: 'markdown',
      maxSize: 1200,
      overlap: 150,
      stripHeaders: false,
    });

    if (chunks.length === 0) {
      throw new Error('No chunks were generated from the scraped markdown');
    }

    const embeddingModel = createEmbeddingModel();
    const embeddingResult = await embeddingModel.doEmbed({
      values: chunks.map((chunk) => chunk.text),
    });

    const documentId = buildDocumentId(document.sourceUrl);
    const ingestedAt = new Date().toISOString();

    const metadata: RagChunkMetadata[] = chunks.map((chunk, index) => ({
      ...(chunk.metadata as Record<string, unknown>),
      text: chunk.text,
      title: document.title,
      sourceUrl: document.sourceUrl,
      documentId,
      chunkIndex: index,
      ingestedAt,
      contentType: document.contentType,
    })) as RagChunkMetadata[];

    await vectorStore.upsert({
      indexName: RAG_INDEX_NAME,
      vectors: embeddingResult.embeddings,
      metadata,
      deleteFilter: {
        sourceUrl: document.sourceUrl,
      },
    });

    return {
      documentId,
      title: document.title,
      sourceUrl: document.sourceUrl,
      contentType: document.contentType,
      chunkCount: chunks.length,
    };
  } finally {
    await vectorStore.disconnect();
  }
}
