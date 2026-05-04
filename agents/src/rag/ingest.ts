import { scrapeDocumentToMarkdown } from './cli/firecrawl.ts';
import { ingestScrapedDocument } from './cli/ingestion.ts';
import { loadEnvironment } from './cli/config.ts';
import { normalizeSourceUrl, parseCliArgs } from './cli/utils.ts';

async function main(): Promise<void> {
    const args = parseCliArgs(process.argv.slice(2));
    const rawUrl = args.positional[0];

    if (!rawUrl) {
        console.error('Usage: pnpm ingest "<url-do-artigo-ou-pdf>"');
        process.exitCode = 1;
        return;
    }

    loadEnvironment(['DATABASE_URL', 'OPENAI_API_KEY', 'FIRECRAWL_API_KEY']);

    const sourceUrl = normalizeSourceUrl(rawUrl);
    const scrapedDocument = await scrapeDocumentToMarkdown(sourceUrl);
    const result = await ingestScrapedDocument(scrapedDocument);

    console.log(`Ingest completed for: ${result.title}`);
    console.log(`Source: ${result.sourceUrl}`);
    console.log(`Document ID: ${result.documentId}`);
    console.log(`Chunks stored: ${result.chunkCount}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
