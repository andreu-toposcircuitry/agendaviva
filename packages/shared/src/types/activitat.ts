import type { TipologiaCodi, QuanEsFaCodi, NDScore, NDNivellCodi, TagId } from '../constants/index.js';

/**
 * Tipologia with confidence score
 */
export interface TipologiaAmbScore {
  codi: TipologiaCodi;
  score: number;
  principal: boolean;
  justificacio?: string;
}

/**
 * Activity status in the editorial workflow
 */
export type ActivitatEstat = 'esborrany' | 'pendent' | 'publicada' | 'arxivada' | 'rebutjada';

/**
 * ND verification status
 */
export type NDVerificatPer = 'inferit' | 'revisat' | 'confirmat_entitat' | 'confirmat_familia';

/**
 * Price period
 */
export type PreuPeriode = 'sessio' | 'mes' | 'trimestre' | 'curs' | 'total';

/**
 * Activity source type
 */
export type FontTipus = 'scraping' | 'email' | 'formulari' | 'manual';

/**
 * Main Activity interface matching the database schema
 */
export interface Activitat {
  id: string;
  entitatId?: string;

  // Basic info
  nom: string;
  slug: string;
  descripcio?: string;
  curs?: string;

  // Classification
  tipologies: TipologiaAmbScore[];
  tipologiaPrincipal: TipologiaCodi;
  subtipologia?: string;

  // Temporal
  quanEsFa: QuanEsFaCodi;

  // Age range
  edatMin?: number;
  edatMax?: number;
  edatText?: string;

  // Location
  municipiId?: string;
  barriZona?: string;
  espai?: string;
  adreca?: string;
  coordenades?: { lat: number; lng: number };
  esOnline?: boolean;

  // Schedule
  dies?: string;
  horari?: string;
  dataInici?: string;
  dataFi?: string;
  calendariObservacions?: string;

  // Cost
  preu?: string;
  preuMin?: number;
  preuMax?: number;
  preuPeriode?: PreuPeriode;
  bequesDisponibles?: boolean;
  preuObservacions?: string;

  // Contact
  email?: string;
  telefon?: string;
  web?: string;
  linkInscripcio?: string;

  // Tags
  tags: TagId[];

  // ND Readiness
  ndScore?: NDScore;
  ndNivell?: NDNivellCodi;
  ndJustificacio?: string;
  ndIndicadorsPositius?: string[];
  ndIndicadorsNegatius?: string[];
  ndRecomanacions?: string[];
  ndConfianca?: number;
  ndVerificatPer?: NDVerificatPer;

  // Status & Workflow
  estat: ActivitatEstat;
  destacada?: boolean;
  ordreDestacat?: number;

  // Source tracking
  fontUrl?: string;
  fontText?: string;
  fontTipus?: FontTipus;
  confiancaGlobal?: number;

  // Agent processing
  agentModel?: string;
  agentVersion?: string;
  agentProcessedAt?: string;
  tipologiesDescartades?: TipologiaAmbScore[];

  // Freshness
  lastVerified?: string;
  lastScraped?: string;
  needsReview?: boolean;
  reviewReason?: string;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notesInternes?: string;
}

/**
 * Activity for public display (matches activitats_public view)
 */
export interface ActivitatPublic {
  id: string;
  nom: string;
  slug: string;
  descripcio?: string;
  tipologiaPrincipal: TipologiaCodi;
  subtipologia?: string;
  tipologies: TipologiaAmbScore[];
  quanEsFa: QuanEsFaCodi;
  edatMin?: number;
  edatMax?: number;
  edatText?: string;
  municipiId?: string;
  municipiNom?: string;
  barriZona?: string;
  espai?: string;
  adreca?: string;
  esOnline?: boolean;
  dies?: string;
  horari?: string;
  preu?: string;
  tags: TagId[];
  ndScore?: NDScore;
  ndNivell?: NDNivellCodi;
  ndJustificacio?: string;
  ndIndicadorsPositius?: string[];
  ndIndicadorsNegatius?: string[];
  ndRecomanacions?: string[];
  ndVerificatPer?: NDVerificatPer;
  destacada?: boolean;
  lastVerified?: string;
  updatedAt: string;
  entitatNom?: string;
  entitatSlug?: string;
  entitatVerificada?: boolean;
  contacteEmail?: string;
  contacteTelefon?: string;
  contacteWeb?: string;
  linkInscripcio?: string;
}

/**
 * Activity create/update input
 */
export interface ActivitatInput {
  nom: string;
  descripcio?: string;
  tipologiaPrincipal: TipologiaCodi;
  tipologies?: TipologiaAmbScore[];
  quanEsFa: QuanEsFaCodi;
  edatMin?: number;
  edatMax?: number;
  municipiId?: string;
  ndScore?: NDScore;
  tags?: TagId[];
  entitatId?: string;
}
