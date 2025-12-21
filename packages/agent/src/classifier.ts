import { agentOutputSchema, type AgentInput, type AgentOutput } from '@agendaviva/shared';
import { complete, type RateLimitConfig } from './client.js';
import { SYSTEM_PROMPT, buildClassificationPrompt, type ClassificationHints } from './prompt.js';

export interface ClassificationResult {
  success: boolean;
  output?: AgentOutput;
  error?: string;
  rawResponse?: string;
  retriesUsed?: number;
}

export interface ClassificationOptions {
  model?: string;
  temperature?: number;
  hints?: ClassificationHints;
  rateLimitConfig?: RateLimitConfig;
}

export interface BatchOptions extends ClassificationOptions {
  onProgress?: (completed: number, total: number, current: ClassificationResult) => void;
  continueOnError?: boolean; // Default: true
  delayBetweenRequests?: number; // Additional delay in ms
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
  const {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    hints,
    rateLimitConfig
  } = options;

  try {
    // Call OpenAI with rate limiting
    const response = await complete(
      SYSTEM_PROMPT,
      buildClassificationPrompt(input.text, hints),
      { model, temperature },
      rateLimitConfig
    );

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
      // FALLBACK STRATEGY: 
      // If strict validation fails, try to construct a partial object 
      // instead of failing completely.
      console.warn(`[Agent] Strict validation failed: ${validated.error.message}. Attempting fallback.`);
      
      const raw = parsed as any;
      if (raw.activitat && raw.activitat.nom) {
         return {
            success: true,
            output: {
               confianca: 0,
               needsReview: true,
               reviewReasons: ["Validation failed, saved via fallback", ...validated.error.errors.map(e => e.message)],
               activitat: {
                  ...raw.activitat,
                  tipologies: raw.activitat.tipologies || [],
                  quanEsFa: raw.activitat.quanEsFa || 'puntual',
                  tags: raw.activitat.tags || []
               },
               nd: raw.nd || { score: 1, nivell: 'nd_desafiador', justificacio: 'Fallback data', indicadorsPositius: [], indicadorsNegatius: [], recomanacions: [], confianca: 0 },
               modelUsed: response.model,
               processingTimeMs: Date.now() - startTime
            },
            rawResponse: response.text
         };
      }
      
      return {
        success: false,
        error: `Validation error: ${validated.error.message}`,
        rawResponse: response.text,
      };
    }

    const output = validated.data as AgentOutput;

    // Post-process: ensure ND-score 5 always needs review
    if (output.nd?.score === 5) {
      output.needsReview = true;
      if (!output.reviewReasons.includes('ND-score 5 requereix verificacio')) {
        output.reviewReasons.push('ND-score 5 requereix verificacio');
      }
    }

    // Ensure low confidence also triggers review
    if (output.nd && output.nd.confianca < 60 && !output.needsReview) {
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
 * Batch classify multiple activities with progress tracking and error resilience
 */
export async function classifyActivities(
  inputs: AgentInput[],
  options: BatchOptions = {}
): Promise<ClassificationResult[]> {
  const {
    onProgress,
    continueOnError = true,
    delayBetweenRequests = 0,
    ...classifyOptions
  } = options;

  const results: ClassificationResult[] = [];
  const total = inputs.length;

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    try {
      const result = await classifyActivity(input, classifyOptions);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, total, result);
      }

      // Don't add delay after the last request
      if (delayBetweenRequests > 0 && i < inputs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    } catch (error) {
      const errorResult: ClassificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown batch error',
      };

      results.push(errorResult);

      if (onProgress) {
        onProgress(i + 1, total, errorResult);
      }

      if (!continueOnError) {
        // Fill remaining with error placeholders
        for (let j = i + 1; j < inputs.length; j++) {
          results.push({
            success: false,
            error: 'Batch processing stopped due to previous error',
          });
        }
        break;
      }
    }
  }

  return results;
}
