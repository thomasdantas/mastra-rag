import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { helpdeskAgent } from './agents/helpdesk-agent';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';
import { researchAgent } from './agents/research-agent';
import { vectorStore } from './rag/vector-store';
import { workspace } from './workspace';
import { contentWorkflow } from './workflows';
import { writerAgent } from './agents/writer-agent';
import { editorAgent } from './agents/editor-agent';
import { factCheckAgent } from './agents/fact-check-agent';

export const mastra = new Mastra({
    agents: { weatherAgent, helpdeskAgent, researchAgent, writerAgent, factCheckAgent, editorAgent },
    vectors: { sources: vectorStore },
    workspace,
    workflows: { weatherWorkflow, contentWorkflow },
    scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
    storage: new MastraCompositeStore({
        id: 'composite-storage',
        default: new PostgresStore({
            id: "mastra-storage",
            connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mastra",
        }),
        domains: {
            observability: await new DuckDBStore().getStore('observability'),
        }
    }),
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    observability: new Observability({
        configs: {
            default: {
                serviceName: 'mastra',
                exporters: [
                    new DefaultExporter(), // Persists traces to storage for Mastra Studio
                    new CloudExporter(), // Sends observability data to hosted Mastra Studio (if MASTRA_CLOUD_ACCESS_TOKEN is set)
                ],
                spanOutputProcessors: [
                    new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
                ],
            },
        },
    }),
});
