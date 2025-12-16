import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    client = new Anthropic({ apiKey });
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

export async function complete(
  systemPrompt: string,
  userPrompt: string,
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const {
    model = 'claude-3-haiku-20240307',
    maxTokens = 4096,
    temperature = 0.3,
  } = options;

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in response');
  }

  return {
    text: textContent.text,
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * Reset the client (useful for testing)
 */
export function resetClient(): void {
  client = null;
}
