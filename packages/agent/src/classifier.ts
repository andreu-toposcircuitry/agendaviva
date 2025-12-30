import { agentOutputSchema, type AgentInput, type AgentOutput } from '@agendaviva/shared';
import { complete } from './client.js';
import { SYSTEM_PROMPT, buildClassificationPrompt } from './prompt.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

export async function classifyActivity(input: AgentInput) {
  const startTime = Date.now();

  try {
    const response = await complete(SYSTEM_PROMPT, buildClassificationPrompt(input.text), {
      model: DEFAULT_MODEL, temperature: 0.2
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, error: 'No JSON found' };

    let parsed: any;
    try { parsed = JSON.parse(jsonMatch[0]); } catch (e) { return { success: false, error: 'JSON parse error' }; }

    // FALLBACK: If name is missing, use a placeholder or skip
    if (!parsed.activitat?.nom) return { success: false, error: 'No activity name found' };

    // Construct valid object with defaults for missing fields
    const output: AgentOutput = {
      confianca: parsed.confianca || 0,
      needsReview: true,
      reviewReasons: parsed.reviewReasons || [],
      activitat: {
        ...parsed.activitat,
        nom: parsed.activitat.nom,
        tipologies: parsed.activitat.tipologies || [],
        quanEsFa: parsed.activitat.quanEsFa || 'puntual',
        tags: parsed.activitat.tags || [],
      },
      // Default ND score to 1 if missing
      nd: parsed.nd || { score: 1, nivell: 'nd_desafiador', justificacio: 'Incomplete data', confianca: 0 },
      modelUsed: response.model,
      processingTimeMs: Date.now() - startTime
    };

    return { success: true, output };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export async function classifyActivities(inputs: AgentInput[]) {
  return Promise.all(inputs.map(input => classifyActivity(input)));
}
