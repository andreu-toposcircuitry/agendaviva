import { agentOutputSchema, type AgentInput, type AgentOutput } from '@agendaviva/shared';
import { complete } from './client.js';
import { SYSTEM_PROMPT, buildClassificationPrompt, type ClassificationHints } from './prompt.js';

// Export the types that index.ts is looking for
export interface ClassificationResult {
  success: boolean;
  output?: AgentOutput;
  error?: string;
  rawResponse?: string;
}

export interface ClassificationOptions {
  model?: string;
  temperature?: number;
  hints?: ClassificationHints;
}

// Alias BatchOptions to ClassificationOptions to satisfy any lingering references
export type BatchOptions = ClassificationOptions;

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Classify an activity using OpenAI with robust fallback
 */
export async function classifyActivity(
  input: AgentInput,
  options: ClassificationOptions = {} // Added options back
): Promise<ClassificationResult> {
  const startTime = Date.now();
  const { model = DEFAULT_MODEL, temperature = 0.2, hints } = options;

  try {
    const response = await complete(SYSTEM_PROMPT, buildClassificationPrompt(input.text, hints), {
      model,
      temperature,
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, error: 'No JSON found', rawResponse: response.text };

    let parsed: any;
    try { parsed = JSON.parse(jsonMatch[0]); } catch (e) { return { success: false, error: 'JSON parse error', rawResponse: response.text }; }

    // --- FALLBACK STRATEGY ---
    // If name is missing, skip.
    if (!parsed.activitat?.nom) return { success: false, error: 'No activity name found' };

    // Fill defaults for missing fields to satisfy strict schema
    const output: AgentOutput = {
      confianca: parsed.confianca || 0,
      needsReview: true, // Default to review if validation fails later
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

    return { success: true, output, rawResponse: response.text };

  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Batch classify multiple activities
 */
export async function classifyActivities(
  inputs: AgentInput[],
  options: ClassificationOptions = {}
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];
  for (const input of inputs) {
    results.push(await classifyActivity(input, options));
  }
  return results;
}
