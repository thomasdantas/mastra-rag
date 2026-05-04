import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { indexSourceFromMarkdown, sourceIdFromMeta } from "../rag/indexer";

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v2/search";
const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 6;

// ------------------------------------------------------------
// TIPOS DA RESPOSTA DO FIRECRAWL
// ------------------------------------------------------------
type FirecrawlSearchResult = {
    title?: string;
    description?: string;
    url?: string;
    markdown?: string;
};

type FirecrawlSearchResponse = {
    success?: boolean;
    error?: string;
    data?: {
        web?: FirecrawlSearchResult[];
    };
};

// ------------------------------------------------------------
// TOOL
// ------------------------------------------------------------
// Tool dinâmica: pesquisa fontes sobre um tópico na web via Firecrawl, baixa como markdown
// e indexa no vector store. Retorna a lista das fontes indexadas (novas ou já cacheadas).
// É o substituto do array estático do exemplo 01 — o corpus do RAG cresce conforme
// o agente pesquisa. Cobre papers (arxiv), blogs, wiki, docs de empresas, etc.
export const researchTopicTool = createTool({
    id: "research-topic",
    description:
        "Pesquisa fontes (papers, blogs, wiki) sobre um tópico, baixa o markdown e adiciona ao índice vetorial. Use SEMPRE antes de responder sobre um tópico novo.",
    inputSchema: z.object({
        topic: z.string().min(2).describe("Tópico ou pergunta em linguagem natural."),
        limit: z
            .number()
            .int()
            .min(1)
            .max(MAX_LIMIT)
            .default(DEFAULT_LIMIT)
            .describe(`Quantas fontes indexar (máx ${MAX_LIMIT}).`),
    }),
    outputSchema: z.object({
        topic: z.string(),
        indexed: z.array(
            z.object({
                id: z.string(),
                title: z.string(),
                url: z.string(),
                chunks: z.number(),
                cached: z.boolean(),
            })
        ),
    }),
    execute: async inputData => {
        const { topic, limit } = inputData;

        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            throw new Error("Missing FIRECRAWL_API_KEY. Preencha no .env do package.");
        }

        // Firecrawl aceita search + scrape numa única chamada.
        // Sem `categories` para cobrir o escopo completo da web: papers (arxiv),
        // blogs (Medium, Papers with Code), Wikipedia, docs de empresas (Anthropic, OpenAI), etc.
        // `scrapeOptions.formats` pede o markdown já na resposta — não precisamos de segundo request.
        const response = await fetch(FIRECRAWL_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: topic,
                limit,
                sources: ["web"],
                scrapeOptions: {
                    formats: [{ type: "markdown" }],
                    onlyMainContent: true,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Firecrawl search falhou com status ${response.status}.`);
        }

        const body = (await response.json()) as FirecrawlSearchResponse;

        if (!body.success || !body.data?.web) {
            throw new Error(body.error ?? "Firecrawl não retornou resultados de busca.");
        }

        // Indexa cada resultado sequencialmente — embedMany já processa em batch por fonte.
        // Se um resultado falhar, logamos e seguimos (alguns PDFs podem não virar markdown limpo).
        const indexed: Array<{
            id: string;
            title: string;
            url: string;
            chunks: number;
            cached: boolean;
        }> = [];

        for (const result of body.data.web) {
            if (!result.url || !result.markdown) {
                continue;
            }

            const title = result.title ?? result.url;
            const id = sourceIdFromMeta(title, result.url);

            try {
                const source = await indexSourceFromMarkdown(
                    { id, title, url: result.url, description: result.description },
                    result.markdown
                );

                indexed.push({
                    id: source.id,
                    title: source.title,
                    url: source.url,
                    chunks: source.chunks,
                    cached: source.cached,
                });
            } catch (error) {
                console.warn(
                    `[research-topic] Falha ao indexar ${title}:`,
                    error instanceof Error ? error.message : error
                );
            }
        }

        return { topic, indexed };
    },
});
