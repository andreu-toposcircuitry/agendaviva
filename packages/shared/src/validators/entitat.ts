import { z } from 'zod';

/**
 * Entity type schema
 */
export const entitatTipusSchema = z.enum(['associacio', 'empresa', 'publica', 'cooperativa']);

/**
 * Entity input schema for creation/updates
 */
export const entitatInputSchema = z.object({
  nom: z.string().min(2, 'El nom ha de tenir almenys 2 caràcters').max(200, 'El nom és massa llarg'),
  descripcio: z.string().max(5000, 'La descripció és massa llarga').optional(),
  tipus: entitatTipusSchema.optional(),
  web: z.string().url('URL invàlida').optional().or(z.literal('')),
  email: z.string().email('Email invàlid').optional().or(z.literal('')),
  telefon: z.string().optional(),
  municipiId: z.string().optional(),
  adreca: z.string().optional(),
});

/**
 * Full entity schema
 */
export const entitatSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().min(2).max(200),
  slug: z.string(),
  descripcio: z.string().max(5000).optional(),
  tipus: entitatTipusSchema.optional(),
  web: z.string().url().optional(),
  email: z.string().email().optional(),
  telefon: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  municipiId: z.string().optional(),
  adreca: z.string().optional(),
  coordenades: z.object({ lat: z.number(), lng: z.number() }).optional(),
  verificada: z.boolean(),
  activa: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
  notesInternes: z.string().optional(),
});

export type EntitatInputSchema = z.infer<typeof entitatInputSchema>;
export type EntitatSchema = z.infer<typeof entitatSchema>;
