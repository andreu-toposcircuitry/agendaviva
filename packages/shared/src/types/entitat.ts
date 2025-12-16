/**
 * Entity type (organization)
 */
export type EntitatTipus = 'associacio' | 'empresa' | 'publica' | 'cooperativa';

/**
 * Entity interface matching the database schema
 */
export interface Entitat {
  id: string;
  nom: string;
  slug: string;
  descripcio?: string;
  tipus?: EntitatTipus;

  // Contact
  web?: string;
  email?: string;
  telefon?: string;

  // Social media
  instagram?: string;
  facebook?: string;
  twitter?: string;

  // Location
  municipiId?: string;
  adreca?: string;
  coordenades?: { lat: number; lng: number };

  // Status
  verificada: boolean;
  activa: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  notesInternes?: string;
}

/**
 * Entity for public display
 */
export interface EntitatPublic {
  id: string;
  nom: string;
  slug: string;
  descripcio?: string;
  tipus?: EntitatTipus;
  web?: string;
  email?: string;
  telefon?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  municipiId?: string;
  adreca?: string;
  verificada: boolean;
}

/**
 * Entity create/update input
 */
export interface EntitatInput {
  nom: string;
  descripcio?: string;
  tipus?: EntitatTipus;
  web?: string;
  email?: string;
  telefon?: string;
  municipiId?: string;
  adreca?: string;
}

/**
 * Entity claim for verification
 */
export interface EntitatClaim {
  id: string;
  entitatId: string;
  userId?: string;
  emailVerificacio: string;
  codiVerificacio?: string;
  verificat: boolean;
  estat: 'pendent' | 'aprovat' | 'rebutjat';
  motiuRebuig?: string;
  createdAt: string;
  resoltAt?: string;
}
