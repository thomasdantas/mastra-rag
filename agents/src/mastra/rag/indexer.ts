import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { embedMany } from "ai";
import { MDocument } from "@mastra/rag";

import { PROJECT_ROOT } from "../lib/project-root";
import { CHUNKING_CONFIG, SOURCES_INDEX_NAME } from "./config";
import { embedder, vectorStore } from "./vector-store";

export type SourceMeta = {
    id: string;
    title: string;
    url: string;
    description?: string;
};

export type IndexedSource = SourceMeta & {
    chunks: number;
    cached: boolean;
};

export type SourceChunkMetadata = {
    citation: string;
    sourceId: string;
    sourceTitle: string;
    sourceUrl: string;
    chunkIndex: number;
    text: string;
};

// ------------------------------------------------------------
// CAMINHOS
// ------------------------------------------------------------
const sourcesCacheDir = join(PROJECT_ROOT, "workspace", "sources");

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
export function sourceIdFromMeta(title: string, url: string) {
    const slug = title
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)/g, "")
        .slice(0, 48);

    const hash = createHash("sha1").update(url).digest("hex").slice(0, 6);

    return slug ? `${slug}-${hash}` : hash;
}

function normaliseChunkText(text: string) {
    return text.replaceAll(/\s+/g, " ").trim();
}

async function fileExists(path: string) {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function ensureSourcesDir() {
    await mkdir(sourcesCacheDir, { recursive: true });
}

function cachePath(sourceId: string) {
    return join(sourcesCacheDir, `${sourceId}.md`);
}

// ------------------------------------------------------------
// CACHE DE MARKDOWN (workspace/sources/*.md)
// ------------------------------------------------------------
export async function readCachedSource(sourceId: string) {
    const path = cachePath(sourceId);

    if (!(await fileExists(path))) {
        return null;
    }

    return readFile(path, "utf-8");
}

// Grava o markdown no cache. Próximas buscas pela mesma URL pulam o scrape.
async function writeCachedSource(sourceId: string, markdown: string) {
    await ensureSourcesDir();
    await writeFile(cachePath(sourceId), markdown, "utf-8");
}

// ------------------------------------------------------------
// CHUNKING
// ------------------------------------------------------------
async function extractChunks(source: SourceMeta, markdown: string) {
    const document = MDocument.fromMarkdown(markdown);
    const chunks = await document.chunk(CHUNKING_CONFIG);

    const usable: Array<{ id: string; metadata: SourceChunkMetadata }> = [];

    for (const chunk of chunks) {
        const text = normaliseChunkText(chunk.text);
        if (text.length < 200) {
            continue;
        }

        const chunkIndex = usable.length + 1;
        usable.push({
            id: `${source.id}-chunk-${chunkIndex}`,
            metadata: {
                citation: `[${source.id}#${chunkIndex}]`,
                sourceId: source.id,
                sourceTitle: source.title,
                sourceUrl: source.url,
                chunkIndex,
                text,
            },
        });
    }

    return usable;
}

// ------------------------------------------------------------
// ÍNDICE VETORIAL
// ------------------------------------------------------------
async function ensureIndex(dimension: number) {
    const existing = await vectorStore.listIndexes();

    if (existing.includes(SOURCES_INDEX_NAME)) {
        return;
    }

    await vectorStore.createIndex({
        indexName: SOURCES_INDEX_NAME,
        dimension,
    });
}

// ------------------------------------------------------------
// FLUXO PRINCIPAL: indexa uma única fonte a partir do markdown já pronto.
// Usado pela research-topic tool (Firecrawl retorna markdown junto com o search).
// Idempotente: chamar 2x com o mesmo sourceId faz upsert nos mesmos IDs.
// ------------------------------------------------------------
export async function indexSourceFromMarkdown(
    source: SourceMeta,
    markdown: string,
    options: { skipIfCached?: boolean } = {}
): Promise<IndexedSource> {
    const alreadyCached = await fileExists(cachePath(source.id));

    if (alreadyCached && options.skipIfCached) {
        // Se já temos o markdown no cache E não queremos reindexar, só marcamos como cached.
        // Útil quando o agente está explorando tópicos e não precisamos refazer embeddings.
        return { ...source, chunks: 0, cached: true };
    }

    await writeCachedSource(source.id, markdown);

    const chunks = await extractChunks(source, markdown);

    if (chunks.length === 0) {
        return { ...source, chunks: 0, cached: alreadyCached };
    }

    const { embeddings } = await embedMany({
        model: embedder,
        values: chunks.map(c => c.metadata.text),
    });

    const dimension = embeddings[0]?.length;
    if (!dimension) {
        throw new Error("The embedding model did not return vectors.");
    }

    await ensureIndex(dimension);

    await vectorStore.upsert({
        indexName: SOURCES_INDEX_NAME,
        ids: chunks.map(c => c.id),
        vectors: embeddings,
        metadata: chunks.map(c => c.metadata),
    });

    return { ...source, chunks: chunks.length, cached: alreadyCached };
}
