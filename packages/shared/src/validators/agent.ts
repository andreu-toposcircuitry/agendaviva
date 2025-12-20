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
 * FIXED: Changed .optional() to .nullish() to accept 'null' from AI
 * Increased max age to 100 to support adult activities
 */
export const agentActivitatResultSchema = z.object({
  nom: z.string(),
  descripcio: z.string().nullish(),
  tipologies: z.array(agentTipologiaResultSchema),
  quanEsFa: z.enum(QUAN_ES_FA_CODIS as [string, ...string[]]).nullish(),
  municipiId: z.string().nullish(),
  barriZona: z.string().nullish(),
  espai: z.string().nullish(),
  adreca: z.string().nullish(),
  edatMin: z.number().int().min(0).max(100).nullish(),
  edatMax: z.number().int().min(0).max(100).nullish(),
  edatText: z.string().nullish(),
  dies: z.string().nullish(),
  horari: z.string().nullish(),
  preu: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal('')), // Allow empty string too
  telefon: z.string().nullish(),
  web: z.string().url().nullish().or(z.literal('')),
  tags: z.array(z.string()).nullish(),
});

/**
 * Complete agent output schema
 * Make ND nullable in case the agent fails to generate it
 */
export const agentOutputSchema = z.object({
  confianca: z.number().min(0).max(100),
  needsReview: z.boolean(),
  reviewReasons: z.array(z.string()),
  activitat: agentActivitatResultSchema,
  nd: agentNDResultSchema.nullish(),
  modelUsed: z.string(),
  processingTimeMs: z.number(),
  rawResponse: z.unknown().optional(),
});

export type AgentInputSchema = z.infer<typeof agentInputSchema>;
export type AgentOutputSchema = z.infer<typeof agentOutputSchema>;
