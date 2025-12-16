import { z } from 'zod';
import { TIPOLOGIA_CODIS, QUAN_ES_FA_CODIS, TAG_IDS } from '../constants/index.js';

/**
 * Tipologia with score schema
 */
export const tipologiaAmbScoreSchema = z.object({
  codi: z.enum(TIPOLOGIA_CODIS as [string, ...string[]]),
  score: z.number().min(0).max(100),
  principal: z.boolean(),
  justificacio: z.string().optional(),
});

/**
 * Activity status schema
 */
export const activitatEstatSchema = z.enum([
  'esborrany',
  'pendent',
  'publicada',
  'arxivada',
  'rebutjada',
]);

/**
 * ND verification schema
 */
export const ndVerificatPerSchema = z.enum([
  'inferit',
  'revisat',
  'confirmat_entitat',
  'confirmat_familia',
]);

/**
 * Price period schema
 */
export const preuPeriodeSchema = z.enum(['sessio', 'mes', 'trimestre', 'curs', 'total']);

/**
 * Source type schema
 */
export const fontTipusSchema = z.enum(['scraping', 'email', 'formulari', 'manual']);

/**
 * Activity input schema for creation/updates
 */
export const activitatInputSchema = z.object({
  nom: z.string().min(3, 'El nom ha de tenir almenys 3 caràcters').max(200, 'El nom és massa llarg'),
  descripcio: z.string().max(5000, 'La descripció és massa llarga').optional(),
  tipologiaPrincipal: z.enum(TIPOLOGIA_CODIS as [string, ...string[]]),
  tipologies: z.array(tipologiaAmbScoreSchema).optional(),
  quanEsFa: z.enum(QUAN_ES_FA_CODIS as [string, ...string[]]),
  edatMin: z.number().int().min(0).max(25).optional(),
  edatMax: z.number().int().min(0).max(25).optional(),
  municipiId: z.string().optional(),
  ndScore: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.enum(TAG_IDS as [string, ...string[]])).optional(),
  entitatId: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.edatMin !== undefined && data.edatMax !== undefined) {
      return data.edatMin <= data.edatMax;
    }
    return true;
  },
  { message: "L'edat mínima no pot ser superior a l'edat màxima" }
);

/**
 * Full activity schema for validation
 */
export const activitatSchema = z.object({
  id: z.string().uuid(),
  entitatId: z.string().uuid().optional(),
  nom: z.string().min(3).max(200),
  slug: z.string(),
  descripcio: z.string().max(5000).optional(),
  curs: z.string().optional(),
  tipologies: z.array(tipologiaAmbScoreSchema),
  tipologiaPrincipal: z.enum(TIPOLOGIA_CODIS as [string, ...string[]]),
  subtipologia: z.string().optional(),
  quanEsFa: z.enum(QUAN_ES_FA_CODIS as [string, ...string[]]),
  edatMin: z.number().int().min(0).max(25).optional(),
  edatMax: z.number().int().min(0).max(25).optional(),
  edatText: z.string().optional(),
  municipiId: z.string().optional(),
  barriZona: z.string().optional(),
  espai: z.string().optional(),
  adreca: z.string().optional(),
  coordenades: z.object({ lat: z.number(), lng: z.number() }).optional(),
  esOnline: z.boolean().optional(),
  dies: z.string().optional(),
  horari: z.string().optional(),
  dataInici: z.string().optional(),
  dataFi: z.string().optional(),
  calendariObservacions: z.string().optional(),
  preu: z.string().optional(),
  preuMin: z.number().optional(),
  preuMax: z.number().optional(),
  preuPeriode: preuPeriodeSchema.optional(),
  bequesDisponibles: z.boolean().optional(),
  preuObservacions: z.string().optional(),
  email: z.string().email().optional(),
  telefon: z.string().optional(),
  web: z.string().url().optional(),
  linkInscripcio: z.string().url().optional(),
  tags: z.array(z.enum(TAG_IDS as [string, ...string[]])),
  ndScore: z.number().int().min(1).max(5).optional(),
  ndNivell: z.string().optional(),
  ndJustificacio: z.string().optional(),
  ndIndicadorsPositius: z.array(z.string()).optional(),
  ndIndicadorsNegatius: z.array(z.string()).optional(),
  ndRecomanacions: z.array(z.string()).optional(),
  ndConfianca: z.number().min(0).max(100).optional(),
  ndVerificatPer: ndVerificatPerSchema.optional(),
  estat: activitatEstatSchema,
  destacada: z.boolean().optional(),
  ordreDestacat: z.number().int().optional(),
  fontUrl: z.string().url().optional(),
  fontText: z.string().optional(),
  fontTipus: fontTipusSchema.optional(),
  confiancaGlobal: z.number().min(0).max(100).optional(),
  agentModel: z.string().optional(),
  agentVersion: z.string().optional(),
  agentProcessedAt: z.string().optional(),
  tipologiesDescartades: z.array(tipologiaAmbScoreSchema).optional(),
  lastVerified: z.string().optional(),
  lastScraped: z.string().optional(),
  needsReview: z.boolean().optional(),
  reviewReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  notesInternes: z.string().optional(),
});

export type ActivitatInputSchema = z.infer<typeof activitatInputSchema>;
export type ActivitatSchema = z.infer<typeof activitatSchema>;
