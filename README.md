# Mastra RAG Agents

Example [Mastra](https://mastra.ai/) application that combines agents, workflows, PostgreSQL-backed vector search (RAG), and a small CLI for ingesting URLs/PDFs and asking grounded questions.

Application code lives under **`agents/`** (there is no package.json at the repo root).

## Prerequisites

- **Node.js** ≥ 22.13 (see `engines` in `agents/package.json`)
- **pnpm** (version pinned via `packageManager` in `agents/package.json`)
- **PostgreSQL** reachable by `DATABASE_URL` for Mastra storage and pgvector indexes used by RAG

## Quick start

From the repository root:

```shell
cd agents
pnpm install
```

Create `agents/.env` with the variables listed below. Mastra loads `.env` from the **`agents`** directory when you run CLI scripts.

Start Mastra Studio (local UI + API):

```shell
pnpm run dev
```

Open [http://localhost:4111](http://localhost:4111) for [Mastra Studio](https://mastra.ai/docs/studio/overview). Edit agents and workflows under `agents/src/mastra`; the dev server reloads on changes.

## What’s in this repo

| Area                        | Location                       | Notes                                                             |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| Mastra app entry            | `agents/src/mastra/index.ts`   | Registers agents, workflows, vector store, storage, observability |
| Agents                      | `agents/src/mastra/agents/`    | Weather, helpdesk, research, writer, editor, fact-check           |
| Workflows                   | `agents/src/mastra/workflows/` | Example weather workflow and content pipeline                     |
| Shared RAG (Mastra vectors) | `agents/src/mastra/rag/`       | Indexing config used by the Mastra workspace                      |
| Standalone RAG CLI          | `agents/src/rag/`              | `ingest` / `ask` scripts below                                    |

## Simple RAG CLI

Scripts are defined in `agents/package.json`. Run them from **`agents/`**:

```shell
pnpm ingest "https://example.com/article.pdf"
pnpm ask "What is the main thesis of the article?"
pnpm ask "What risks are described?" --source "https://example.com/article.pdf"
pnpm ask "Summarize the conclusion." --top-k 10
```

- **`ingest`** — scrapes the URL via Firecrawl, chunks content, embeds with OpenAI, stores vectors in PostgreSQL.
- **`ask`** — retrieves chunks (optionally filtered by `--source`), answers with an LLM constrained to retrieved context (CLI answers default to Brazilian Portuguese).

### Environment variables

Add these to **`agents/.env`**:

| Variable            | Required for        | Purpose                                                      |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`      | Studio, ingest, ask | Postgres + pgvector for Mastra storage and RAG index         |
| `OPENAI_API_KEY`    | ingest, ask         | Embeddings and answer model (`agents/src/rag/cli/config.ts`) |
| `FIRECRAWL_API_KEY` | **ingest only**     | Scraping URLs/PDFs to markdown                               |

Optional:

| Variable                    | Purpose                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `MASTRA_CLOUD_ACCESS_TOKEN` | Sends observability to hosted Mastra when configured (`CloudExporter` in `agents/src/mastra/index.ts`) |

If `DATABASE_URL` is unset, Mastra’s default storage connection in code falls back to `postgresql://postgres:postgres@localhost:5432/mastra` — only use that if you actually run Postgres with matching credentials.

## Learn more

- [Mastra documentation](https://mastra.ai/docs/) — agents, tools, workflows, evals, observability
- [Course](https://mastra.ai/learn), [YouTube](https://youtube.com/@mastra-ai), [Discord](https://discord.gg/BTYqqHKUrf)

## Deploy to the Mastra platform

[Mastra platform](https://projects.mastra.ai) offers **Studio** (hosted testing and traces) and **Server** (production API). See [Mastra platform docs](https://mastra.ai/docs/mastra-platform/overview).
