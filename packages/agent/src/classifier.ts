import { agentOutputSchema, type AgentInput, type AgentOutput } from '@agendaviva/shared';
import { complete } from './client.js';
import { SYSTEM_PROMPT, buildClassificationPrompt, type ClassificationHints } from './prompt.js';

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

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.2;

/**
 * Classify an activity using OpenAI
 */
export async function classifyActivity(
  input: AgentInput,
  options: ClassificationOptions = {}
): Promise<ClassificationResult> {
  const startTime = Date.now();
  const { model = DEFAULT_MODEL, temperature = DEFAULT_TEMPERATURE, hints } = options;

  try {
    // Call OpenAI
    const response = await complete(SYSTEM_PROMPT, buildClassificationPrompt(input.text, hints), {
      model,
      temperature,
    });

    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'No JSON found in response',
        rawResponse: response.text,
      };
    }

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return {
        success: false,
        error: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
        rawResponse: response.text,
      };
    }

    // Add model and processing time metadata
    const withMetadata = {
      ...(parsed as Record<string, unknown>),
      modelUsed: response.model,
      processingTimeMs: Date.now() - startTime,
    };

    // Validate with Zod
    const validated = agentOutputSchema.safeParse(withMetadata);

    if (!validated.success) {
      return {
        success: false,
        error: `Validation error: ${validated.error.message}`,
        rawResponse: response.text,
      };
    }

    const output = validated.data as AgentOutput;

    // Post-process: ensure ND-score 5 always needs review
    if (output.nd.score === 5) {
      output.needsReview = true;
      if (!output.reviewReasons.includes('ND-score 5 requereix verificacio')) {
        output.reviewReasons.push('ND-score 5 requereix verificacio');
      }
    }

    // Ensure low confidence also triggers review
    if (output.nd.confianca < 60 && !output.needsReview) {
      output.needsReview = true;
      if (!output.reviewReasons.includes('Baixa confianca en avaluacio ND')) {
        output.reviewReasons.push('Baixa confianca en avaluacio ND');
      }
    }

    return {
      success: true,
      output,
      rawResponse: response.text,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
    const result = await classifyActivity(input, options);
    results.push(result);
  }

  return results;
}
