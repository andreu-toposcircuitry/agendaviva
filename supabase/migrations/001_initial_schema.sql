-- ============================================
-- AGENDA VIVA VO - Initial Schema
-- ============================================
-- Migration: 001_initial_schema
-- Description: Complete database schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search

-- ============================================
-- REFERENCE TABLES
-- ============================================

-- Municipalities of Vallès Oriental
CREATE TABLE municipis (
  id TEXT PRIMARY KEY,  -- e.g., 'granollers'
  nom TEXT NOT NULL,
  nom_oficial TEXT,     -- Official name if different
  comarca TEXT DEFAULT 'Vallès Oriental',
  codis_postals TEXT[] DEFAULT '{}',
  poblacio INTEGER,
  coordenades GEOGRAPHY(POINT),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE municipis IS 'Municipalities of Vallès Oriental';

-- Insert all Vallès Oriental municipalities
INSERT INTO municipis (id, nom, codis_postals, poblacio) VALUES
  ('ametlla', 'L''Ametlla del Vallès', ARRAY['08480'], 8800),
  ('bigues-riells', 'Bigues i Riells', ARRAY['08415'], 9200),
  ('caldes-montbui', 'Caldes de Montbui', ARRAY['08140'], 17500),
  ('campins', 'Campins', ARRAY['08479'], 500),
  ('canovelles', 'Canovelles', ARRAY['08420'], 16500),
  ('cardedeu', 'Cardedeu', ARRAY['08440'], 18500),
  ('castellcir', 'Castellcir', ARRAY['08183'], 700),
  ('castelltercol', 'Castellterçol', ARRAY['08183'], 2400),
  ('fogars-montclus', 'Fogars de Montclús', ARRAY['08479'], 450),
  ('garriga', 'La Garriga', ARRAY['08530'], 16500),
  ('granera', 'Granera', ARRAY['08183'], 80),
  ('granollers', 'Granollers', ARRAY['08400', '08401', '08402', '08403'], 61500),
  ('gualba', 'Gualba', ARRAY['08474'], 1500),
  ('gurb', 'Gurb', ARRAY['08503'], 2600),
  ('llagosta', 'La Llagosta', ARRAY['08120'], 13800),
  ('llerona', 'Llerona', ARRAY['08520'], NULL),  -- Part of Les Franqueses
  ('les-franqueses', 'Les Franqueses del Vallès', ARRAY['08520'], 20000),
  ('llica-amunt', 'Lliçà d''Amunt', ARRAY['08186'], 15500),
  ('llica-vall', 'Lliçà de Vall', ARRAY['08185'], 6500),
  ('llinars', 'Llinars del Vallès', ARRAY['08450'], 10500),
  ('martorelles', 'Martorelles', ARRAY['08107'], 5200),
  ('mollet', 'Mollet del Vallès', ARRAY['08100'], 51500),
  ('montmelo', 'Montmeló', ARRAY['08160'], 10000),
  ('montornes', 'Montornès del Vallès', ARRAY['08170'], 16500),
  ('montseny', 'Montseny', ARRAY['08469'], 350),
  ('parets', 'Parets del Vallès', ARRAY['08150'], 19000),
  ('roca', 'La Roca del Vallès', ARRAY['08430'], 11000),
  ('sant-antoni-vilamajor', 'Sant Antoni de Vilamajor', ARRAY['08459'], 6500),
  ('sant-celoni', 'Sant Celoni', ARRAY['08470'], 18500),
  ('sant-esteve-palautordera', 'Sant Esteve de Palautordera', ARRAY['08461'], 2800),
  ('sant-feliu-codines', 'Sant Feliu de Codines', ARRAY['08182'], 6200),
  ('sant-fost-campsentelles', 'Sant Fost de Campsentelles', ARRAY['08105'], 8800),
  ('sant-pere-vilamajor', 'Sant Pere de Vilamajor', ARRAY['08458'], 4500),
  ('sant-quirze-safaja', 'Sant Quirze Safaja', ARRAY['08189'], 700),
  ('santa-eulalia-roncana', 'Santa Eulàlia de Ronçana', ARRAY['08187'], 7500),
  ('santa-maria-martorelles', 'Santa Maria de Martorelles', ARRAY['08106'], 900),
  ('santa-maria-palautordera', 'Santa Maria de Palautordera', ARRAY['08460'], 9500),
  ('tagamanent', 'Tagamanent', ARRAY['08593'], 350),
  ('vallgorguina', 'Vallgorguina', ARRAY['08471'], 3000),
  ('vallromanes', 'Vallromanes', ARRAY['08188'], 2600),
  ('vilalba-sasserra', 'Vilalba Sasserra', ARRAY['08455'], 750),
  ('vilanova-valles', 'Vilanova del Vallès', ARRAY['08410'], 5500);

-- ============================================
-- CORE TABLES
-- ============================================

-- Entities (organizations that offer activities)
CREATE TABLE entitats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcio TEXT,
  tipus TEXT,  -- 'associacio', 'empresa', 'publica', 'cooperativa'
  
  -- Contact
  web TEXT,
  email TEXT,
  telefon TEXT,
  
  -- Social media
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,
  
  -- Location
  municipi_id TEXT REFERENCES municipis(id),
  adreca TEXT,
  coordenades GEOGRAPHY(POINT),
  
  -- Status
  verificada BOOLEAN DEFAULT FALSE,
  activa BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'agent',
  notes_internes TEXT  -- For moderators
);

CREATE INDEX entitats_municipi_idx ON entitats (municipi_id);
CREATE INDEX entitats_slug_idx ON entitats (slug);
CREATE INDEX entitats_nom_trgm_idx ON entitats USING GIN (nom gin_trgm_ops);

COMMENT ON TABLE entitats IS 'Organizations that offer activities';

-- Activities (the core content)
CREATE TABLE activitats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitat_id UUID REFERENCES entitats(id) ON DELETE SET NULL,
  
  -- Basic info
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcio TEXT,
  curs TEXT DEFAULT '2025-2026',
  
  -- Classification (JSONB for flexibility)
  tipologies JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"codi": "arts", "score": 85, "principal": true, "justificacio": "..."}]
  tipologia_principal TEXT NOT NULL,
  subtipologia TEXT,
  
  -- Temporal classification
  quan_es_fa TEXT NOT NULL CHECK (quan_es_fa IN (
    'setmanal', 
    'caps_de_setmana', 
    'intensiu_vacances', 
    'puntual', 
    'flexible'
  )),
  
  -- Age range
  edat_min INTEGER CHECK (edat_min >= 0 AND edat_min <= 25),
  edat_max INTEGER CHECK (edat_max >= 0 AND edat_max <= 25),
  edat_text TEXT,  -- Original text, e.g., "de P3 a 6è"
  
  -- Location
  municipi_id TEXT REFERENCES municipis(id),
  barri_zona TEXT,
  espai TEXT,      -- e.g., "Casal de Cultura", "Pavelló Municipal"
  adreca TEXT,
  coordenades GEOGRAPHY(POINT),
  es_online BOOLEAN DEFAULT FALSE,
  
  -- Schedule
  dies TEXT,       -- e.g., "Dilluns i dimecres"
  horari TEXT,     -- e.g., "17:00-18:30"
  data_inici DATE,
  data_fi DATE,
  calendari_observacions TEXT,
  
  -- Cost
  preu TEXT,       -- Free text: "150€/trimestre", "Gratuït", etc.
  preu_min NUMERIC(10,2),
  preu_max NUMERIC(10,2),
  preu_periode TEXT CHECK (preu_periode IN ('sessio', 'mes', 'trimestre', 'curs', 'total')),
  beques_disponibles BOOLEAN,
  preu_observacions TEXT,
  
  -- Contact (can override entitat)
  email TEXT,
  telefon TEXT,
  web TEXT,
  link_inscripcio TEXT,
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- ============================================
  -- ND READINESS (the differentiator)
  -- ============================================
  nd_score INTEGER CHECK (nd_score BETWEEN 1 AND 5),
  nd_nivell TEXT CHECK (nd_nivell IN (
    'nd_excellent',    -- 5
    'nd_preparat',     -- 4
    'nd_compatible',   -- 3
    'nd_variable',     -- 2
    'nd_desafiador'    -- 1
  )),
  nd_justificacio TEXT,
  nd_indicadors_positius TEXT[] DEFAULT '{}',
  nd_indicadors_negatius TEXT[] DEFAULT '{}',
  nd_recomanacions TEXT[] DEFAULT '{}',
  nd_confianca INTEGER CHECK (nd_confianca BETWEEN 0 AND 100),
  nd_verificat_per TEXT CHECK (nd_verificat_per IN (
    'inferit',           -- Agent guessed
    'revisat',           -- Moderator reviewed
    'confirmat_entitat', -- Entity confirmed
    'confirmat_familia'  -- Family confirmed
  )) DEFAULT 'inferit',
  
  -- ============================================
  -- STATUS & WORKFLOW
  -- ============================================
  estat TEXT DEFAULT 'pendent' CHECK (estat IN (
    'esborrany',   -- Being edited
    'pendent',     -- Awaiting review
    'publicada',   -- Live
    'arxivada',    -- Hidden but kept
    'rebutjada'    -- Won't publish
  )),
  destacada BOOLEAN DEFAULT FALSE,
  ordre_destacat INTEGER,
  
  -- Source tracking
  font_url TEXT,
  font_text TEXT,          -- Original scraped text
  font_tipus TEXT,         -- 'scraping', 'email', 'formulari', 'manual'
  confianca_global INTEGER CHECK (confianca_global BETWEEN 0 AND 100),
  
  -- Agent processing
  agent_model TEXT,        -- e.g., 'claude-3-haiku'
  agent_version TEXT,
  agent_processed_at TIMESTAMPTZ,
  agent_raw_response JSONB,
  tipologies_descartades JSONB,  -- For transparency
  
  -- Freshness tracking
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  last_scraped TIMESTAMPTZ,
  needs_review BOOLEAN DEFAULT FALSE,
  review_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'agent',
  verificat_per UUID,      -- References auth.users
  notes_internes TEXT,     -- For moderators
  
  -- Full-text search (generated)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', COALESCE(nom, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(descripcio, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(espai, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'C')
  ) STORED,
  
  -- Constraints
  CONSTRAINT valid_age_range CHECK (edat_min IS NULL OR edat_max IS NULL OR edat_min <= edat_max),
  CONSTRAINT valid_price_range CHECK (preu_min IS NULL OR preu_max IS NULL OR preu_min <= preu_max)
);

-- Indexes for common queries
CREATE INDEX activitats_search_idx ON activitats USING GIN (search_vector);
CREATE INDEX activitats_municipi_idx ON activitats (municipi_id);
CREATE INDEX activitats_tipologia_idx ON activitats (tipologia_principal);
CREATE INDEX activitats_nd_score_idx ON activitats (nd_score);
CREATE INDEX activitats_estat_idx ON activitats (estat);
CREATE INDEX activitats_entitat_idx ON activitats (entitat_id);
CREATE INDEX activitats_quan_idx ON activitats (quan_es_fa);
CREATE INDEX activitats_edat_idx ON activitats (edat_min, edat_max);
CREATE INDEX activitats_tags_idx ON activitats USING GIN (tags);
CREATE INDEX activitats_nom_trgm_idx ON activitats USING GIN (nom gin_trgm_ops);
CREATE INDEX activitats_updated_idx ON activitats (updated_at DESC);

COMMENT ON TABLE activitats IS 'Activities - the core content of the directory';
COMMENT ON COLUMN activitats.nd_score IS 'ND-readiness score from 1 (challenging) to 5 (excellent)';
COMMENT ON COLUMN activitats.tipologies IS 'Array of typologies with scores: [{"codi": "arts", "score": 85}]';

-- ============================================
-- WORKFLOW TABLES
-- ============================================

-- Review queue for human moderation
CREATE TABLE cua_revisio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activitat_id UUID REFERENCES activitats(id) ON DELETE CASCADE,
  
  -- Priority
  prioritat TEXT DEFAULT 'mitjana' CHECK (prioritat IN ('alta', 'mitjana', 'baixa')),
  
  -- Reason for review
  motiu TEXT NOT NULL,
  motiu_detall JSONB,  -- Structured: {"tipologies_ambigues": [...], "nd_score_5": true, ...}
  
  -- Estimation
  temps_estimat_minuts INTEGER DEFAULT 2,
  
  -- Assignment
  assignat_a UUID,  -- References auth.users
  
  -- Resolution
  resolt_at TIMESTAMPTZ,
  resolt_per UUID,  -- References auth.users
  resolucio TEXT CHECK (resolucio IN ('aprovat', 'editat', 'rebutjat', 'saltat')),
  resolucio_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX cua_revisio_activitat_idx ON cua_revisio (activitat_id);
CREATE INDEX cua_revisio_prioritat_idx ON cua_revisio (prioritat, created_at);
CREATE INDEX cua_revisio_pending_idx ON cua_revisio (resolt_at) WHERE resolt_at IS NULL;

COMMENT ON TABLE cua_revisio IS 'Queue of activities pending human review';

-- Audit log
CREATE TABLE historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What changed
  taula TEXT NOT NULL,  -- 'activitats', 'entitats', etc.
  registre_id UUID NOT NULL,
  
  -- Who changed it
  actor TEXT NOT NULL,  -- 'agent', 'system', or user_id
  actor_nom TEXT,
  
  -- Change details
  accio TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  canvis JSONB,         -- {field: {old: x, new: y}}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX historial_registre_idx ON historial (taula, registre_id);
CREATE INDEX historial_actor_idx ON historial (actor);
CREATE INDEX historial_created_idx ON historial (created_at DESC);

COMMENT ON TABLE historial IS 'Audit log for all changes';

-- ============================================
-- SCRAPING & INGESTION
-- ============================================

-- Sources for scraping
CREATE TABLE fonts_scraping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  nom TEXT NOT NULL,
  tipus TEXT CHECK (tipus IN ('web', 'instagram', 'facebook', 'newsletter', 'api', 'rss')),
  url TEXT NOT NULL,
  
  -- Scraping config
  selector_css TEXT,
  config JSONB,  -- Additional scraping config
  
  -- Status
  activa BOOLEAN DEFAULT TRUE,
  frequency_hours INTEGER DEFAULT 24,
  
  -- Last run
  last_scraped TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  last_error TEXT,
  last_items_found INTEGER,
  
  -- Stats
  total_items_found INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX fonts_scraping_activa_idx ON fonts_scraping (activa);
CREATE INDEX fonts_scraping_next_run_idx ON fonts_scraping (last_scraped) WHERE activa = TRUE;

COMMENT ON TABLE fonts_scraping IS 'Web sources to scrape for activities';

-- Email ingestion log
CREATE TABLE emails_ingestats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email data
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  
  -- Processing
  processat BOOLEAN DEFAULT FALSE,
  processat_at TIMESTAMPTZ,
  activitat_creada_id UUID REFERENCES activitats(id),
  
  -- If failed
  error TEXT,
  
  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  raw_headers JSONB
);

CREATE INDEX emails_ingestats_processat_idx ON emails_ingestats (processat);
CREATE INDEX emails_ingestats_from_idx ON emails_ingestats (from_email);

COMMENT ON TABLE emails_ingestats IS 'Log of emails received for activity ingestion';

-- ============================================
-- USER FEATURES
-- ============================================

-- Favorites (for logged-in users)
CREATE TABLE favorits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- References auth.users
  activitat_id UUID REFERENCES activitats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activitat_id)
);

CREATE INDEX favorits_user_idx ON favorits (user_id);

COMMENT ON TABLE favorits IS 'User favorites (backup for localStorage)';

-- Entity claims (entity owners verifying their profile)
CREATE TABLE entitat_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitat_id UUID REFERENCES entitats(id) ON DELETE CASCADE,
  user_id UUID,  -- References auth.users
  
  -- Verification
  email_verificacio TEXT NOT NULL,
  codi_verificacio TEXT,
  verificat BOOLEAN DEFAULT FALSE,
  
  -- Status
  estat TEXT DEFAULT 'pendent' CHECK (estat IN ('pendent', 'aprovat', 'rebutjat')),
  motiu_rebuig TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolt_at TIMESTAMPTZ,
  resolt_per UUID
);

CREATE INDEX entitat_claims_entitat_idx ON entitat_claims (entitat_id);
CREATE INDEX entitat_claims_estat_idx ON entitat_claims (estat);

COMMENT ON TABLE entitat_claims IS 'Claims by entity owners to manage their profile';

-- ============================================
-- PAYMENTS & DONATIONS
-- ============================================

CREATE TABLE transaccions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe
  stripe_payment_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Type
  tipus TEXT CHECK (tipus IN ('donacio', 'quota_entitat', 'patrocini')),
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  
  -- Payer
  email TEXT,
  nom TEXT,
  entitat_id UUID REFERENCES entitats(id),
  
  -- Status
  estat TEXT DEFAULT 'completada' CHECK (estat IN ('pendent', 'completada', 'fallada', 'reemborsada')),
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transaccions_stripe_idx ON transaccions (stripe_payment_id);
CREATE INDEX transaccions_entitat_idx ON transaccions (entitat_id);

COMMENT ON TABLE transaccions IS 'Donations and entity fees';

-- ============================================
-- VIEWS
-- ============================================

-- Public view of activities (only published)
CREATE VIEW activitats_public AS
SELECT 
  a.id,
  a.nom,
  a.slug,
  a.descripcio,
  a.tipologia_principal,
  a.subtipologia,
  a.tipologies,
  a.quan_es_fa,
  a.edat_min,
  a.edat_max,
  a.edat_text,
  a.municipi_id,
  m.nom AS municipi_nom,
  a.barri_zona,
  a.espai,
  a.adreca,
  a.es_online,
  a.dies,
  a.horari,
  a.preu,
  a.tags,
  a.nd_score,
  a.nd_nivell,
  a.nd_justificacio,
  a.nd_indicadors_positius,
  a.nd_indicadors_negatius,
  a.nd_recomanacions,
  a.nd_verificat_per,
  a.destacada,
  a.last_verified,
  a.updated_at,
  e.nom AS entitat_nom,
  e.slug AS entitat_slug,
  e.verificada AS entitat_verificada,
  COALESCE(a.email, e.email) AS contacte_email,
  COALESCE(a.telefon, e.telefon) AS contacte_telefon,
  COALESCE(a.web, e.web) AS contacte_web,
  a.link_inscripcio
FROM activitats a
LEFT JOIN entitats e ON a.entitat_id = e.id
LEFT JOIN municipis m ON a.municipi_id = m.id
WHERE a.estat = 'publicada';

COMMENT ON VIEW activitats_public IS 'Public view of published activities with entity info';

-- Review queue with activity details
CREATE VIEW cua_revisio_detall AS
SELECT 
  c.*,
  a.nom AS activitat_nom,
  a.tipologia_principal,
  a.nd_score,
  a.confianca_global,
  a.font_url,
  e.nom AS entitat_nom
FROM cua_revisio c
JOIN activitats a ON c.activitat_id = a.id
LEFT JOIN entitats e ON a.entitat_id = e.id
WHERE c.resolt_at IS NULL
ORDER BY 
  CASE c.prioritat 
    WHEN 'alta' THEN 1 
    WHEN 'mitjana' THEN 2 
    WHEN 'baixa' THEN 3 
  END,
  c.created_at;

COMMENT ON VIEW cua_revisio_detall IS 'Review queue with activity details for moderators';

-- Stats dashboard
CREATE VIEW stats_dashboard AS
SELECT
  (SELECT COUNT(*) FROM activitats WHERE estat = 'publicada') AS total_publicades,
  (SELECT COUNT(*) FROM activitats WHERE estat = 'pendent') AS total_pendents,
  (SELECT COUNT(*) FROM cua_revisio WHERE resolt_at IS NULL) AS cua_pendents,
  (SELECT COUNT(*) FROM entitats WHERE activa = TRUE) AS total_entitats,
  (SELECT COUNT(*) FROM entitats WHERE verificada = TRUE) AS entitats_verificades,
  (SELECT COUNT(*) FROM activitats WHERE estat = 'publicada' AND nd_score >= 4) AS nd_friendly,
  (SELECT COUNT(*) FROM activitats WHERE estat = 'publicada' AND last_verified > NOW() - INTERVAL '90 days') AS recent_verified,
  (SELECT COUNT(*) FROM transaccions WHERE created_at > NOW() - INTERVAL '30 days') AS transaccions_mes;

COMMENT ON VIEW stats_dashboard IS 'Quick stats for admin dashboard';

-- ============================================
-- FUNCTIONS
-- ============================================

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

CREATE TRIGGER fonts_scraping_updated_at
  BEFORE UPDATE ON fonts_scraping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          input_text,
          'àáâãäåèéêëìíîïòóôõöùúûüñç·',
          'aaaaaaeeeeiiiiooooouuuunc-'
        ),
        '[^a-z0-9\-]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log activity changes
CREATE OR REPLACE FUNCTION log_activitat_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    changes = jsonb_build_object(
      'nom', CASE WHEN OLD.nom IS DISTINCT FROM NEW.nom 
             THEN jsonb_build_object('old', OLD.nom, 'new', NEW.nom) END,
      'estat', CASE WHEN OLD.estat IS DISTINCT FROM NEW.estat 
               THEN jsonb_build_object('old', OLD.estat, 'new', NEW.estat) END,
      'nd_score', CASE WHEN OLD.nd_score IS DISTINCT FROM NEW.nd_score 
                  THEN jsonb_build_object('old', OLD.nd_score, 'new', NEW.nd_score) END
    );
    -- Remove nulls
    changes = (SELECT jsonb_object_agg(key, value) FROM jsonb_each(changes) WHERE value IS NOT NULL);
    
    IF changes IS NOT NULL AND changes != '{}' THEN
      INSERT INTO historial (taula, registre_id, actor, accio, canvis)
      VALUES (
        'activitats',
        NEW.id,
        COALESCE(auth.uid()::TEXT, 'system'),
        'UPDATE',
        changes
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO historial (taula, registre_id, actor, accio, canvis)
    VALUES (
      'activitats',
      NEW.id,
      COALESCE(auth.uid()::TEXT, NEW.created_by, 'system'),
      'INSERT',
      jsonb_build_object('nom', NEW.nom, 'estat', NEW.estat)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER activitats_audit
  AFTER INSERT OR UPDATE ON activitats
  FOR EACH ROW EXECUTE FUNCTION log_activitat_changes();

-- Full-text search function
CREATE OR REPLACE FUNCTION search_activitats(
  search_query TEXT,
  filter_municipi TEXT DEFAULT NULL,
  filter_tipologia TEXT DEFAULT NULL,
  filter_nd_min INTEGER DEFAULT NULL,
  filter_edat INTEGER DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  nom TEXT,
  slug TEXT,
  descripcio TEXT,
  tipologia_principal TEXT,
  municipi_nom TEXT,
  nd_score INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.nom,
    a.slug,
    a.descripcio,
    a.tipologia_principal,
    m.nom AS municipi_nom,
    a.nd_score,
    ts_rank(a.search_vector, websearch_to_tsquery('spanish', search_query)) AS rank
  FROM activitats a
  LEFT JOIN municipis m ON a.municipi_id = m.id
  WHERE 
    a.estat = 'publicada'
    AND (search_query IS NULL OR search_query = '' OR a.search_vector @@ websearch_to_tsquery('spanish', search_query))
    AND (filter_municipi IS NULL OR a.municipi_id = filter_municipi)
    AND (filter_tipologia IS NULL OR a.tipologia_principal = filter_tipologia)
    AND (filter_nd_min IS NULL OR a.nd_score >= filter_nd_min)
    AND (filter_edat IS NULL OR (
      (a.edat_min IS NULL OR a.edat_min <= filter_edat) AND
      (a.edat_max IS NULL OR a.edat_max >= filter_edat)
    ))
  ORDER BY 
    rank DESC,
    a.destacada DESC,
    a.updated_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE activitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cua_revisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorits ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitat_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaccions ENABLE ROW LEVEL SECURITY;

-- Public read for published activities
CREATE POLICY "Public read published activities" ON activitats
  FOR SELECT USING (estat = 'publicada');

-- Public read for active entities
CREATE POLICY "Public read active entities" ON entitats
  FOR SELECT USING (activa = TRUE);

-- Moderators have full access
CREATE POLICY "Moderators full access to activitats" ON activitats
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('moderator', 'admin')
  );

CREATE POLICY "Moderators full access to entitats" ON entitats
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('moderator', 'admin')
  );

CREATE POLICY "Moderators full access to cua_revisio" ON cua_revisio
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('moderator', 'admin')
  );

CREATE POLICY "Moderators read historial" ON historial
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('moderator', 'admin')
  );

-- Users manage own favorites
CREATE POLICY "Users manage own favorites" ON favorits
  FOR ALL USING (auth.uid() = user_id);

-- Users see own entity claims
CREATE POLICY "Users see own claims" ON entitat_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create claims" ON entitat_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Moderators manage claims
CREATE POLICY "Moderators manage claims" ON entitat_claims
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('moderator', 'admin')
  );

-- ============================================
-- SERVICE ROLE ACCESS (for agent/scraper)
-- ============================================

-- The service role (used by agent/scraper) bypasses RLS by default
-- No additional policies needed

-- ============================================
-- GRANTS
-- ============================================

-- Public (anon) access
GRANT SELECT ON activitats_public TO anon;
GRANT SELECT ON municipis TO anon;
GRANT EXECUTE ON FUNCTION search_activitats TO anon;

-- Authenticated users
GRANT SELECT ON activitats_public TO authenticated;
GRANT SELECT ON municipis TO authenticated;
GRANT ALL ON favorits TO authenticated;
GRANT SELECT, INSERT ON entitat_claims TO authenticated;
GRANT EXECUTE ON FUNCTION search_activitats TO authenticated;

-- Service role has full access by default

-- ============================================
-- INITIAL DATA (Reference only, actual in seed.sql)
-- ============================================

-- Typologies reference (for documentation, not stored in DB)
COMMENT ON COLUMN activitats.tipologia_principal IS 
'Typologies: arts, esports, natura_ciencia, cultura_popular, llengua_cultura, lleure, social_comunitari, accio_social, educacio_reforc';
