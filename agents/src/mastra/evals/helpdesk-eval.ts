import { runEvals } from '@mastra/core/evals';
import { mastra } from '../index';
import { helpdeskBomDiaScorer } from '../scorers/helpdesk-scorer';

const helpdeskAgent = mastra.getAgent('helpdeskAgent');

const result = await runEvals({
    target: helpdeskAgent,
    data: [ // prompts to test the helpdesk agent
        { input: 'Bom dia! Quero abrir um chamado: o sistema está apresentando erro ao salvar.' },
        { input: 'Como faço para redefinir minha senha?' },
        { input: 'Me conta uma piada engraçada sobre programadores.' },
    ],
    scorers: [helpdeskBomDiaScorer],
    concurrency: 2, // concurrency level for the evals
    onItemComplete: ({ item, targetResult, scorerResults }) => {
        const input = typeof item.input === 'string' ? item.input : JSON.stringify(item.input);
        console.log(`\n[item] ${input}`);
        console.log(`[output] ${targetResult.text}`);
        for (const [scorerId, res] of Object.entries(scorerResults)) {
            const score = (res as any)?.score;
            const reason = (res as any)?.reason;
            console.log(`  - ${scorerId}: score=${score}${reason ? ` reason=${reason}` : ''}`);
        }
    },
});

console.log('\n=== Summary ===');
console.log(`Total items: ${result.summary.totalItems}`);
console.log('Average scores:', result.scores);

process.exit(0);
