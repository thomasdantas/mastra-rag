import { createScorer } from '@mastra/core/evals';
import {
    getAssistantMessageFromRunOutput
} from '@mastra/evals/scorers/utils';


export const helpdeskBomDiaScorer = createScorer({
    id: 'helpdesk-bom-dia-scorer',
    name: 'Helpdesk Bom Dia',
    description: 'Verifica se a resposta do agente contém a string "bom dia".',
})
    .preprocess(({ run }) => {
        const assistantText = getAssistantMessageFromRunOutput(run.output) || '';
        return { assistantText };
    })
    .generateScore(({ results }) => {
        const text = (results as any)?.preprocessStepResult?.assistantText ?? '';
        return text.toLowerCase().includes('bom dia') ? 1 : 0;
    })
    .generateReason(({ score }) =>
        score === 1 ? 'Resposta contém "bom dia".' : 'Resposta NÃO contém "bom dia".',
    );

export const helpdeskScorers = {
    helpdeskBomDiaScorer,
};
