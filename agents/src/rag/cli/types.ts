export interface RagChunkMetadata {
  text: string;
  title: string;
  sourceUrl: string;
  documentId: string;
  chunkIndex: number;
  ingestedAt: string;
  contentType?: string;
}

export interface ScrapedDocument {
  sourceUrl: string;
  title: string;
  markdown: string;
  contentType?: string;
}
