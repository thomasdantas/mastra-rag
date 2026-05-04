import { askRag } from './cli/answer.ts';
import { loadEnvironment } from './cli/config.ts';
import { getStringFlag, normalizeSourceUrl, parseCliArgs } from './cli/utils.ts';

async function main(): Promise<void> {
    const args = parseCliArgs(process.argv.slice(2));
    const question = args.positional.join(' ').trim();

    if (!question) {
        console.error('Usage: pnpm ask "<pergunta>" [--source "<url>"] [--top-k <n>]');
        process.exitCode = 1;
        return;
    }

    loadEnvironment(['DATABASE_URL', 'OPENAI_API_KEY']);

    const sourceValue = getStringFlag(args.flags, 'source', 'source-url');
    const topKValue = getStringFlag(args.flags, 'top-k');
    const topK = topKValue ? Number.parseInt(topKValue, 10) : undefined;

    if (topKValue && Number.isNaN(topK)) {
        throw new Error(`Invalid --top-k value: ${topKValue}`);
    }

    const result = await askRag({
        question,
        sourceUrl: sourceValue ? normalizeSourceUrl(sourceValue) : undefined,
        topK,
    });

    console.log(result.answer);

    if (result.matches.length > 0) {
        console.log('\nSources:');

        const uniqueSources = new Map<string, string>();
        for (const match of result.matches) {
            const sourceUrl =
                typeof match.metadata?.sourceUrl === 'string' ? match.metadata.sourceUrl : 'unknown';
            const title =
                typeof match.metadata?.title === 'string' ? match.metadata.title : sourceUrl;

            if (!uniqueSources.has(sourceUrl)) {
                uniqueSources.set(sourceUrl, title);
            }
        }

        for (const [sourceUrl, title] of uniqueSources.entries()) {
            console.log(`- ${title}: ${sourceUrl}`);
        }
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
