import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyActivity } from '../src/classifier.js';
import type { AgentInput } from '@agendaviva/shared';

// Mock the client module
vi.mock('../src/client.js', () => ({
  complete: vi.fn(),
  getAnthropicClient: vi.fn(),
  resetClient: vi.fn(),
}));

import { complete } from '../src/client.js';

const mockComplete = vi.mocked(complete);

describe('classifyActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify a simple activity successfully', async () => {
    const mockResponse = {
      confianca: 85,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Escola de Musica',
        descripcio: 'Classes de musica per a infants',
        tipologies: [{ codi: 'arts', score: 90, justificacio: 'Es una activitat de musica' }],
        quanEsFa: 'setmanal',
        municipiId: 'granollers',
        edatMin: 6,
        edatMax: 12,
        tags: [],
      },
      nd: {
        score: 3,
        nivell: 'nd_compatible',
        justificacio: 'Estructura normal sense indicadors especifics',
        indicadorsPositius: [],
        indicadorsNegatius: [],
        recomanacions: [],
        confianca: 70,
      },
    };

    mockComplete.mockResolvedValue({
      text: JSON.stringify(mockResponse),
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 200,
    });

    const input: AgentInput = {
      text: 'Escola de Musica de Granollers. Classes de piano per a nens de 6 a 12 anys. Dilluns i dimecres de 17h a 18h.',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(true);
    expect(result.output?.activitat.nom).toBe('Escola de Musica');
    expect(result.output?.nd.score).toBe(3);
    expect(result.output?.modelUsed).toBe('claude-3-haiku-20240307');
    expect(result.output?.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should force review when ND-score is 5', async () => {
    const mockResponse = {
      confianca: 95,
      needsReview: false, // Will be overridden
      reviewReasons: [],
      activitat: {
        nom: 'Activitat Inclusiva',
        tipologies: [{ codi: 'accio_social', score: 85, justificacio: 'Inclusio explicita' }],
        quanEsFa: 'setmanal',
        municipiId: 'mollet',
        tags: ['nd:adaptat_tea'],
      },
      nd: {
        score: 5,
        nivell: 'nd_excellent',
        justificacio: 'Adaptacions explicites per TEA',
        indicadorsPositius: ['grups_reduits', 'estructura_clara', 'formacio_especifica'],
        indicadorsNegatius: [],
        recomanacions: [],
        confianca: 90,
      },
    };

    mockComplete.mockResolvedValue({
      text: JSON.stringify(mockResponse),
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 200,
    });

    const input: AgentInput = {
      text: 'Activitat inclusiva amb adaptacions per TEA',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(true);
    expect(result.output?.needsReview).toBe(true);
    expect(result.output?.reviewReasons).toContain('ND-score 5 requereix verificacio');
  });

  it('should force review when ND confidence is low', async () => {
    const mockResponse = {
      confianca: 70,
      needsReview: false, // Will be overridden
      reviewReasons: [],
      activitat: {
        nom: 'Activitat Ambigua',
        tipologies: [{ codi: 'lleure', score: 75, justificacio: 'Activitat de lleure' }],
        quanEsFa: 'puntual',
        tags: [],
      },
      nd: {
        score: 3,
        nivell: 'nd_compatible',
        justificacio: 'Poca informacio disponible',
        indicadorsPositius: [],
        indicadorsNegatius: [],
        recomanacions: ['Demanar mes informacio'],
        confianca: 45, // Low confidence
      },
    };

    mockComplete.mockResolvedValue({
      text: JSON.stringify(mockResponse),
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 200,
    });

    const input: AgentInput = {
      text: 'Una activitat sense gaire detalls',
      sourceType: 'scraping',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(true);
    expect(result.output?.needsReview).toBe(true);
    expect(result.output?.reviewReasons).toContain('Baixa confianca en avaluacio ND');
  });

  it('should handle JSON extraction from wrapped response', async () => {
    const mockResponse = {
      confianca: 80,
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Activitat Test',
        tipologies: [{ codi: 'esports', score: 85, justificacio: 'Esport' }],
        quanEsFa: 'setmanal',
        tags: [],
      },
      nd: {
        score: 3,
        nivell: 'nd_compatible',
        justificacio: 'Test',
        indicadorsPositius: [],
        indicadorsNegatius: [],
        recomanacions: [],
        confianca: 70,
      },
    };

    // Response with extra text before and after JSON
    mockComplete.mockResolvedValue({
      text: `Aqui tens la resposta:\n\n${JSON.stringify(mockResponse)}\n\nEspero que sigui util.`,
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 200,
    });

    const input: AgentInput = {
      text: 'Curs de futbol per a joves',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(true);
    expect(result.output?.activitat.nom).toBe('Activitat Test');
  });

  it('should return error when no JSON found', async () => {
    mockComplete.mockResolvedValue({
      text: 'No puc processar aquesta informacio.',
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 50,
    });

    const input: AgentInput = {
      text: 'Text invalid',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No JSON found in response');
    expect(result.rawResponse).toBe('No puc processar aquesta informacio.');
  });

  it('should return error when JSON is malformed', async () => {
    // JSON with matching braces but invalid syntax inside
    mockComplete.mockResolvedValue({
      text: '{ "confianca": 80, "activitat": { "nom": broken } }',
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 50,
    });

    const input: AgentInput = {
      text: 'Text que genera JSON invalid',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON parse error');
  });

  it('should return error when validation fails', async () => {
    const invalidResponse = {
      confianca: 'not a number', // Should be number
      needsReview: false,
      reviewReasons: [],
      activitat: {
        nom: 'Test',
        tipologies: [],
        quanEsFa: 'setmanal',
      },
      nd: {
        score: 3,
        nivell: 'nd_compatible',
        justificacio: 'Test',
        indicadorsPositius: [],
        indicadorsNegatius: [],
        recomanacions: [],
        confianca: 70,
      },
    };

    mockComplete.mockResolvedValue({
      text: JSON.stringify(invalidResponse),
      model: 'claude-3-haiku-20240307',
      inputTokens: 100,
      outputTokens: 200,
    });

    const input: AgentInput = {
      text: 'Test input',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation error');
  });

  it('should handle API errors gracefully', async () => {
    mockComplete.mockRejectedValue(new Error('API rate limit exceeded'));

    const input: AgentInput = {
      text: 'Test input',
      sourceType: 'manual',
    };

    const result = await classifyActivity(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('API rate limit exceeded');
  });
});
