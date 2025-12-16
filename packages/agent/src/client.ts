import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({ apiKey });
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
    model = 'gpt-4o-mini',
    maxTokens = 4096,
    temperature = 0.3,
  } = options;

  const openai = getOpenAIClient();

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
}

/**
 * Reset the client (useful for testing)
 */
export function resetClient(): void {
  client = null;
}
