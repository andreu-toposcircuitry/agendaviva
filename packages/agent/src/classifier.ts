import OpenAI from 'openai';
import type { ClassificationInput, ClassificationOutput } from '@agendaviva/shared/types';
import { SYSTEM_PROMPT, buildClassificationPrompt } from './prompt.js';

export class ActivityClassifier {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async classify(input: ClassificationInput): Promise<ClassificationOutput> {
    const userPrompt = buildClassificationPrompt(input.text, input.context);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent outputs
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as ClassificationOutput;
      
      // Validate and sanitize the result
      return this.validateAndSanitize(result);
    } catch (error) {
      console.error('Error classifying activity:', error);
      throw error;
    }
  }

  private validateAndSanitize(result: ClassificationOutput): ClassificationOutput {
    // Ensure required fields are present
    if (!result.nom || !result.tipologia_principal || !result.quan_es_fa || !result.municipi) {
      throw new Error('Missing required fields in classification result');
    }

    // Ensure ND score is in valid range
    if (result.nd_score < 1 || result.nd_score > 5) {
      result.nd_score = 3;
      result.nd_confianca = 20;
    }

    // Ensure arrays exist
    result.tipologies = result.tipologies || [];
    result.tags = result.tags || [];
    result.nd_indicadors_positius = result.nd_indicadors_positius || [];
    result.nd_indicadors_negatius = result.nd_indicadors_negatius || [];
    result.nd_recomanacions = result.nd_recomanacions || [];

    return result;
  }

  async classifyBatch(inputs: ClassificationInput[]): Promise<ClassificationOutput[]> {
    // Process in parallel with rate limiting
    const results: ClassificationOutput[] = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limits

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(input => this.classify(input).catch(err => {
          console.error(`Error classifying activity: ${err.message}`);
          return null;
        }))
      );
      results.push(...batchResults.filter(r => r !== null) as ClassificationOutput[]);
    }

    return results;
  }
}
