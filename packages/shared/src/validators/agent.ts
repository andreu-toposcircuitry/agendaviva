import { z } from 'zod';
import { TIPOLOGIA_CODIS, QUAN_ES_FA_CODIS } from '../constants/index.js';

/**
 * Agent input schema
 */
export const agentInputSchema = z.object({
  text: z.string().min(10, 'El text ha de tenir almenys 10 caràcters'),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(['scraping', 'email', 'formulari', 'manual']),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Agent tipologia result schema
 */
export const agentTipologiaResultSchema = z.object({
  codi: z.enum(TIPOLOGIA_CODIS as [string, ...string[]]),
  score: z.number().min(0).max(100),
  justificacio: z.string(),
});

/**
 * Agent ND result schema
 */
export const agentNDResultSchema = z.object({
  score: z.number().int().min(1).max(5),
  nivell: z.string(),
  justificacio: z.string(),
  indicadorsPositius: z.array(z.string()),
  indicadorsNegatius: z.array(z.string()),
  recomanacions: z.array(z.string()),
  confianca: z.number().min(0).max(100),
});

/**
 * Agent activity result schema
 */
export const agentActivitatResultSchema = z.object({
  nom: z.string(),
  descripcio: z.string().optional(),
  tipologies: z.array(agentTipologiaResultSchema),
  quanEsFa: z.enum(QUAN_ES_FA_CODIS as [string, ...string[]]),
  municipiId: z.string().optional(),
  barriZona: z.string().optional(),
  espai: z.string().optional(),
  adreca: z.string().optional(),
  edatMin: z.number().int().min(0).max(25).optional(),
  edatMax: z.number().int().min(0).max(25).optional(),
  edatText: z.string().optional(),
  dies: z.string().optional(),
  horari: z.string().optional(),
  preu: z.string().optional(),
  email: z.string().email().optional(),
  telefon: z.string().optional(),
  web: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Complete agent output schema
 */
export const agentOutputSchema = z.object({
  confianca: z.number().min(0).max(100),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  activitat: agentActivitatResultSchema,
  nd: agentNDResultSchema,
  modelUsed: z.string(),
  processingTimeMs: z.number(),
  rawResponse: z.unknown().optional(),
});

export type AgentInputSchema = z.infer<typeof agentInputSchema>;
export type AgentOutputSchema = z.infer<typeof agentOutputSchema>;
