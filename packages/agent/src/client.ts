import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({
      apiKey,
      maxRetries: 0, // We handle retries ourselves
    });
  }
  return client;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface RateLimitConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  requestsPerMinute?: number;
}

const DEFAULT_RATE_LIMIT_CONFIG: Required<RateLimitConfig> = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  requestsPerMinute: 50, // Conservative default for GPT-4o-mini
};

// Simple token bucket for rate limiting
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60000;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate;
      await sleep(Math.ceil(waitTime));
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let rateLimiter: RateLimiter | null = null;

function getRateLimiter(config: Required<RateLimitConfig>): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter(config.requestsPerMinute);
  }
  return rateLimiter;
}

export async function complete(
  systemPrompt: string,
  userPrompt: string,
  options: CompletionOptions = {},
  rateLimitConfig: RateLimitConfig = {}
): Promise<CompletionResult> {
  const {
    model = 'gpt-4o-mini',
    maxTokens = 4096,
    temperature = 0.3,
  } = options;

  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...rateLimitConfig };
  const limiter = getRateLimiter(config);
  const openai = getOpenAIClient();

  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Wait for rate limiter
      await limiter.acquire();

      const response = await openai.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No content in response');
      }

      return {
        text: choice.message.content,
        model: response.model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      };
    } catch (error: any) {
      lastError = error;

      // Check if retryable
      const status = error?.status || error?.response?.status;
      const isRateLimited = status === 429;
      const isServerError = status >= 500 && status < 600;
      const isRetryable = isRateLimited || isServerError;

      if (!isRetryable || attempt === config.maxRetries) {
        throw error;
      }

      // Extract retry-after header if present
      const retryAfter = error?.headers?.['retry-after'];
      if (retryAfter) {
        delay = parseInt(retryAfter, 10) * 1000;
      }

      console.warn(
        `[OpenAI] Attempt ${attempt + 1}/${config.maxRetries + 1} failed: ${error.message}. ` +
        `Retrying in ${delay}ms...`
      );

      await sleep(delay);

      // Exponential backoff with jitter
      delay = Math.min(config.maxDelayMs, delay * 2 * (0.5 + Math.random() * 0.5));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Reset the client and rate limiter (for testing)
 */
export function resetClient(): void {
  client = null;
  rateLimiter = null;
}
