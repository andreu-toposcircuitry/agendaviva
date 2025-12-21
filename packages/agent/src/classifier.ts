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

// Fallback constants for when validation fails
const FALLBACK_ND_DEFAULTS = {
  score: 1,
  nivell: 'nd_desafiador',
  justificacio: 'Fallback data - requires manual review',
  indicadorsPositius: [],
  indicadorsNegatius: [],
  recomanacions: [],
  confianca: 0,
} as const;

// Minimum expected structure for fallback validation
interface MinimalFallbackData {
  activitat?: {
    nom?: string;
    tipologies?: unknown[];
    quanEsFa?: string;
    tags?: unknown[];
    [key: string]: unknown;
  };
  nd?: unknown;
}

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
      // instead of failing completely. This allows us to save partially
      // valid data that can be reviewed and corrected by humans later.
      console.warn(`[Agent] Strict validation failed: ${validated.error.message}. Attempting fallback.`);
      
      const raw = parsed as MinimalFallbackData;
      
      // Critical check: Skip activities without a name
      // If the AI didn't find a name, it's not a valid activity
      if (!raw.activitat?.nom || typeof raw.activitat.nom !== 'string' || raw.activitat.nom.length === 0) {
        return {
          success: false,
          error: 'No activity name identified (skipped)',
          rawResponse: response.text,
        };
      }
      
      // Build fallback output with defaults for missing fields
      return {
         success: true,
         output: {
            confianca: 0,
            needsReview: true,
            reviewReasons: ["Validation failed, saved via fallback", ...validated.error.errors.map(e => e.message)],
            activitat: {
               ...raw.activitat,
               nom: raw.activitat.nom, // Verified above
               // NOTE: Using 'as any' here is intentional. We're in fallback mode
               // where the AI returned data that doesn't match our strict schema.
               // We accept the risk to save partial data for human review rather
               // than discarding potentially useful information.
               tipologies: (raw.activitat.tipologies || []) as any,
               quanEsFa: (raw.activitat.quanEsFa || 'puntual') as any,
               tags: (raw.activitat.tags || []) as any
            },
            // Default ND score to 1 ("Desafiador") if AI failed to classify
            nd: (raw.nd || FALLBACK_ND_DEFAULTS) as any,
            modelUsed: response.model,
            processingTimeMs: Date.now() - startTime
         } as AgentOutput,
         rawResponse: response.text
      };
    }

    const output = validated.data as AgentOutput;
    
    // Post-validation: Ensure defaults are set for nullable fields
    // This handles the case where validation passed but fields are null/undefined
    if (!output.activitat.nom) {
      // If validation passed but nom is still missing, skip this activity
      return {
        success: false,
        error: 'No activity name identified (skipped)',
        rawResponse: response.text,
      };
    }
    
    // Ensure defaults for required fields that may be null
    output.confianca = output.confianca ?? 0;
    output.needsReview = output.needsReview ?? true;
    output.reviewReasons = output.reviewReasons ?? [];
    output.activitat.tipologies = output.activitat.tipologies ?? [];
    output.activitat.quanEsFa = output.activitat.quanEsFa ?? 'puntual';
    output.activitat.tags = output.activitat.tags ?? [];
    
    // Provide default ND score if missing
    if (!output.nd || output.nd.score === null || output.nd.score === undefined) {
      output.nd = FALLBACK_ND_DEFAULTS as any;
      output.needsReview = true;
      if (!output.reviewReasons.includes('ND score missing, used default')) {
        output.reviewReasons.push('ND score missing, used default');
      }
    }

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
