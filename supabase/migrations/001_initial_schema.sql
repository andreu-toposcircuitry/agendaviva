-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Core tables
CREATE TABLE entitats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcio TEXT,
  web TEXT,
  email TEXT,
  telefon TEXT,
  instagram TEXT,
  verificada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activitats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitat_id UUID REFERENCES entitats(id),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcio TEXT,
  curs TEXT DEFAULT '2025-2026',
  
  -- Classification (JSONB for flexibility)
  tipologies JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"codi": "arts", "score": 85, "justificacio": "..."}]
  tipologia_principal TEXT NOT NULL,
  subtipologia TEXT,
  quan_es_fa TEXT NOT NULL CHECK (quan_es_fa IN ('setmanal', 'caps_de_setmana', 'intensiu_vacances', 'puntual', 'flexible')),
  
  -- Age range
  edat_min INTEGER,
  edat_max INTEGER,
  edat_text TEXT,
  
  -- Location
  municipi TEXT NOT NULL,
  barri_zona TEXT,
  espai TEXT,
  adreca TEXT,
  coordenades GEOGRAPHY(POINT),
  
  -- Schedule
  dies TEXT,
  horari TEXT,
  
  -- Cost
  preu TEXT,
  preu_observacions TEXT,
  
  -- Contact (can override entitat)
  email TEXT,
  telefon TEXT,
  web TEXT,
  link_inscripcio TEXT,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- ND Readiness
  nd_score INTEGER CHECK (nd_score BETWEEN 1 AND 5),
  nd_nivell TEXT,
  nd_justificacio TEXT,
  nd_indicadors_positius TEXT[] DEFAULT '{}',
  nd_indicadors_negatius TEXT[] DEFAULT '{}',
  nd_recomanacions TEXT[] DEFAULT '{}',
  nd_confianca INTEGER CHECK (nd_confianca BETWEEN 0 AND 100),
  nd_verificat_per TEXT CHECK (nd_verificat_per IN ('inferit', 'revisat', 'confirmat_entitat', 'confirmat_familia')),
  
  -- Metadata
  estat TEXT DEFAULT 'pendent' CHECK (estat IN ('pendent', 'publicada', 'arxivada', 'rebutjada')),
  destacada BOOLEAN DEFAULT FALSE,
  font_url TEXT,
  font_text TEXT,
  confianca_global INTEGER CHECK (confianca_global BETWEEN 0 AND 100),
  
  -- Freshness
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ,
  verificat_per TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'agent',
  
  -- Search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(nom, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(descripcio, '')), 'B') ||
    setweight(to_tsvector('catalan', coalesce(nom, '')), 'A') ||
    setweight(to_tsvector('catalan', coalesce(descripcio, '')), 'B')
  ) STORED
);

CREATE INDEX activitats_search_idx ON activitats USING GIN (search_vector);
CREATE INDEX activitats_municipi_idx ON activitats (municipi);
CREATE INDEX activitats_tipologia_idx ON activitats (tipologia_principal);
CREATE INDEX activitats_nd_score_idx ON activitats (nd_score);
CREATE INDEX activitats_estat_idx ON activitats (estat);

-- Review queue
CREATE TABLE cua_revisio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activitat_id UUID REFERENCES activitats(id) ON DELETE CASCADE,
  prioritat TEXT DEFAULT 'mitjana' CHECK (prioritat IN ('alta', 'mitjana', 'baixa')),
  motiu TEXT NOT NULL,
  motiu_detall JSONB,
  temps_estimat_minuts INTEGER DEFAULT 2,
  assignat_a UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolt_at TIMESTAMPTZ,
  resolt_per UUID,
  resolucio TEXT CHECK (resolucio IN ('aprovat', 'editat', 'rebutjat', 'saltat'))
);

-- Audit log
CREATE TABLE historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activitat_id UUID REFERENCES activitats(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  actor_nom TEXT,
  accio TEXT NOT NULL,
  canvis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraping sources
CREATE TABLE fonts_scraping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  tipus TEXT CHECK (tipus IN ('web', 'instagram', 'facebook', 'newsletter', 'api')),
  url TEXT NOT NULL,
  selector_css TEXT,
  activa BOOLEAN DEFAULT TRUE,
  frequency_hours INTEGER DEFAULT 24,
  last_scraped TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  activitat_id UUID REFERENCES activitats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activitat_id)
);

-- Entity claims
CREATE TABLE entitat_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitat_id UUID REFERENCES entitats(id),
  user_id UUID,
  email_verificacio TEXT NOT NULL,
  estat TEXT DEFAULT 'pendent' CHECK (estat IN ('pendent', 'aprovat', 'rebutjat')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolt_at TIMESTAMPTZ
);

-- Donations/Payments tracking
CREATE TABLE transaccions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id TEXT UNIQUE,
  tipus TEXT CHECK (tipus IN ('donacio', 'quota_entitat', 'patrocini')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  email TEXT,
  entitat_id UUID REFERENCES entitats(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Municipalities reference
CREATE TABLE municipis (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  comarca TEXT DEFAULT 'Vallès Oriental',
  codi_postal TEXT[],
  poblacio INTEGER
);

-- Insert Vallès Oriental municipalities
INSERT INTO municipis (id, nom, codi_postal) VALUES
  ('granollers', 'Granollers', ARRAY['08400', '08401', '08402']),
  ('mollet', 'Mollet del Vallès', ARRAY['08100']),
  ('la-garriga', 'La Garriga', ARRAY['08530']),
  ('cardedeu', 'Cardedeu', ARRAY['08440']),
  ('les-franqueses', 'Les Franqueses del Vallès', ARRAY['08520']),
  ('canovelles', 'Canovelles', ARRAY['08420']),
  ('la-roca', 'La Roca del Vallès', ARRAY['08430']),
  ('caldes-montbui', 'Caldes de Montbui', ARRAY['08140']),
  ('sant-celoni', 'Sant Celoni', ARRAY['08470']),
  ('llinars', 'Llinars del Vallès', ARRAY['08450']),
  ('parets', 'Parets del Vallès', ARRAY['08150']),
  ('montornes', 'Montornès del Vallès', ARRAY['08170']),
  ('montmelo', 'Montmeló', ARRAY['08160']),
  ('santa-eulalia', 'Santa Eulàlia de Ronçana', ARRAY['08187']),
  ('bigues-riells', 'Bigues i Riells', ARRAY['08415']),
  ('lliça-amunt', 'Lliçà d''Amunt', ARRAY['08186']),
  ('lliça-vall', 'Lliçà de Vall', ARRAY['08185']),
  ('vilanova-valles', 'Vilanova del Vallès', ARRAY['08410']);

-- Functions and Triggers

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activitats_updated_at
  BEFORE UPDATE ON activitats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER entitats_updated_at
  BEFORE UPDATE ON entitats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log changes to historial
CREATE OR REPLACE FUNCTION log_activitat_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historial (activitat_id, actor, accio, canvis)
  VALUES (
    NEW.id,
    COALESCE(CURRENT_USER, 'agent'),
    TG_OP,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activitats_audit
  AFTER UPDATE ON activitats
  FOR EACH ROW EXECUTE FUNCTION log_activitat_changes();

-- Row Level Security
ALTER TABLE activitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cua_revisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial ENABLE ROW LEVEL SECURITY;

-- Public can read published activities
CREATE POLICY "Public read published" ON activitats
  FOR SELECT USING (estat = 'publicada');

-- Allow all operations for service role (used in backend)
CREATE POLICY "Service role full access" ON activitats
  FOR ALL USING (true);

CREATE POLICY "Public read municipis" ON municipis
  FOR SELECT USING (true);
