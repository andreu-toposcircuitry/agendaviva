export interface Entitat {
  id: string;
  nom: string;
  slug: string;
  descripcio?: string;
  web?: string;
  email?: string;
  telefon?: string;
  instagram?: string;
  verificada: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipologiaScore {
  codi: string;
  score: number;
  justificacio: string;
}

export interface Activitat {
  id: string;
  entitat_id?: string;
  nom: string;
  slug: string;
  descripcio?: string;
  curs: string;
  
  // Classification
  tipologies: TipologiaScore[];
  tipologia_principal: string;
  subtipologia?: string;
  quan_es_fa: 'setmanal' | 'caps_de_setmana' | 'intensiu_vacances' | 'puntual' | 'flexible';
  
  // Age range
  edat_min?: number;
  edat_max?: number;
  edat_text?: string;
  
  // Location
  municipi: string;
  barri_zona?: string;
  espai?: string;
  adreca?: string;
  coordenades?: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  
  // Schedule
  dies?: string;
  horari?: string;
  
  // Cost
  preu?: string;
  preu_observacions?: string;
  
  // Contact
  email?: string;
  telefon?: string;
  web?: string;
  link_inscripcio?: string;
  
  // Tags
  tags: string[];
  
  // ND Readiness
  nd_score?: number; // 1-5
  nd_nivell?: string;
  nd_justificacio?: string;
  nd_indicadors_positius: string[];
  nd_indicadors_negatius: string[];
  nd_recomanacions: string[];
  nd_confianca?: number; // 0-100
  nd_verificat_per?: 'inferit' | 'revisat' | 'confirmat_entitat' | 'confirmat_familia';
  
  // Metadata
  estat: 'pendent' | 'publicada' | 'arxivada' | 'rebutjada';
  destacada: boolean;
  font_url?: string;
  font_text?: string;
  confianca_global?: number; // 0-100
  
  // Freshness
  last_verified: string;
  last_scraped?: string;
  verificat_per?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CuaRevisio {
  id: string;
  activitat_id: string;
  prioritat: 'alta' | 'mitjana' | 'baixa';
  motiu: string;
  motiu_detall?: Record<string, any>;
  temps_estimat_minuts: number;
  assignat_a?: string;
  created_at: string;
  resolt_at?: string;
  resolt_per?: string;
  resolucio?: 'aprovat' | 'editat' | 'rebutjat' | 'saltat';
}

export interface Historial {
  id: string;
  activitat_id: string;
  actor: string;
  actor_nom?: string;
  accio: string;
  canvis?: Record<string, any>;
  created_at: string;
}

export interface FontScraping {
  id: string;
  nom: string;
  tipus: 'web' | 'instagram' | 'facebook' | 'newsletter' | 'api';
  url: string;
  selector_css?: string;
  activa: boolean;
  frequency_hours: number;
  last_scraped?: string;
  last_error?: string;
  created_at: string;
}

export interface Municipi {
  id: string;
  nom: string;
  comarca: string;
  codi_postal: string[];
  poblacio?: number;
}

export interface SearchFilters {
  municipi?: string;
  tipologia?: string;
  edat?: number;
  nd_min?: number;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ClassificationInput {
  text: string;
  context?: {
    source?: string;
    url?: string;
    entity?: string;
  };
}

export interface ClassificationOutput {
  nom: string;
  descripcio?: string;
  tipologies: TipologiaScore[];
  tipologia_principal: string;
  subtipologia?: string;
  quan_es_fa: Activitat['quan_es_fa'];
  edat_min?: number;
  edat_max?: number;
  edat_text?: string;
  municipi: string;
  barri_zona?: string;
  dies?: string;
  horari?: string;
  preu?: string;
  tags: string[];
  nd_score: number;
  nd_nivell: string;
  nd_justificacio: string;
  nd_indicadors_positius: string[];
  nd_indicadors_negatius: string[];
  nd_recomanacions: string[];
  nd_confianca: number;
  confianca_global: number;
}
