-- Seed data for AgendaViva VO
-- Inserts sample data for testing the MVP: Web frontend and Admin Panel

-- IMPORTANT: This script assumes the 001_initial_schema.sql migration has been run.

-- ============================================
-- 1. ENTITIES (entitats)
-- ============================================

INSERT INTO entitats (id, nom, slug, tipus, web, email, verificada, activa) VALUES
('b2a9e3f1-0d1a-4c2b-8a3d-4e5c6f7d8a9b', 'Escola de Teatre La Crisalide', generate_slug('Escola de Teatre La Crisalide'), 'associacio', 'https://crisalide.cat', 'hola@crisalide.cat', TRUE, TRUE),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Campus Tecnologic VO', generate_slug('Campus Tecnologic VO'), 'empresa', 'https://techvo.org', 'info@techvo.org', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. ACTIVITIES (activitats)
-- ============================================

INSERT INTO activitats (
  id, entitat_id, nom, slug, descripcio, tipologies, tipologia_principal, quan_es_fa, edat_min, edat_max, municipi_id, espai, dies, preu, tags, nd_score, nd_nivell, nd_justificacio, nd_indicadors_positius, nd_indicadors_negatius, nd_recomanacions, nd_confianca, estat, destacada, created_by
) VALUES (
  '100a0000-0000-4000-a000-000000000001',
  'b2a9e3f1-0d1a-4c2b-8a3d-4e5c6f7d8a9b',
  'Taller de Teatre Inclusiu',
  generate_slug('Taller de Teatre Inclusiu'),
  'Classes de teatre per a nens i nenes amb una metodologia respectuosa i grups molt reduïts per assegurar l''atenció individualitzada. Fomentem la creativitat i l''expressió lliure.',
  '[{"codi": "arts", "score": 95, "principal": true, "justificacio": "Activitats de teatre i expressio"}, {"codi": "accio_social", "score": 80, "principal": false, "justificacio": "Enfocament inclusiu i social"}]'::jsonb,
  'arts',
  'setmanal',
  8,
  14,
  'cardedeu',
  'Local Social Cardedeu',
  'Dijous',
  '60€/mes',
  ARRAY['valors:inclusiu', 'format:grups_reduits', 'nd:estructura_clara'],
  4,
  'nd_preparat',
  'Grups reduïts i metodologia no competitiva. La descripció indica un ambient tranquil.',
  ARRAY['Grups reduïts (màx 10)', 'Estructura clara de la sessió'],
  ARRAY['Soroll moderat segons horari del centre'],
  ARRAY['Mantenir grup reduït i anticipar canvis de sessió'],
  85,
  'publicada',
  FALSE,
  'seed'
),
(
  '100a0000-0000-4000-a000-000000000002',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Campus d''Estiu de Robòtica Competitiva',
  generate_slug('Campus d''Estiu de Robòtica Competitiva'),
  'Campus intensiu de robòtica per a joves. El focus principal és la preparació per a tornejos de robòtica. Grups de 25 participants. Molt ritme i soroll ambiental.',
  '[{"codi": "natura_ciencia", "score": 100, "principal": true, "justificacio": "Curs de robòtica i programació"}]'::jsonb,
  'natura_ciencia',
  'intensiu_vacances',
  12,
  16,
  'granollers',
  'Centre Tecnològic Granollers',
  'De dilluns a divendres',
  '350€/setmana',
  ARRAY['format:presencial', 'valors:no_competitiu'],
  2,
  'nd_variable',
  'Alta competició, grups grans i ritme intensiu. Alt risc de sobreestimulació sensorial.',
  ARRAY['Temàtica d''interès per a ND'],
  ARRAY['Ambient de competició', 'Grup gran (+20 persones)', 'Ritme ràpid'],
  ARRAY['Proposar espais de calma per participants ND'],
  90,
  'publicada',
  FALSE,
  'seed'
),
(
  '100a0000-0000-4000-a000-000000000003',
  NULL,
  'Reforç Escolar amb Adaptacions TEA/TDAH',
  generate_slug('Reforç Escolar amb Adaptacions TEA/TDAH'),
  'Servei de reforç escolar amb una educadora especialitzada en neurodiversitat. Es menciona flexibilitat i suport individualitzat.',
  '[{"codi": "educacio_reforc", "score": 88, "principal": true, "justificacio": "Suport educatiu i tècniques d''estudi"}]'::jsonb,
  'educacio_reforc',
  'flexible',
  7,
  18,
  'mollet',
  'Despatx privat',
  NULL,
  'Consultar',
  ARRAY['nd:adaptat_tea', 'nd:adaptat_tdah'],
  4,
  'nd_preparat',
  'Menció explícita d''adaptacions i especialització en ND.',
  ARRAY['Personal especialitzat', 'Suport individualitzat'],
  ARRAY['Sense menció de grup reduït'],
  ARRAY['Confirmar mida del grup abans de publicar'],
  70,
  'pendent',
  FALSE,
  'agent'
);

-- ============================================
-- 3. REVIEW QUEUE (cua_revisio)
-- ============================================

INSERT INTO cua_revisio (activitat_id, prioritat, motiu, motiu_detall, temps_estimat_minuts, created_at) VALUES
(
  '100a0000-0000-4000-a000-000000000003',
  'alta',
  'Menció de "necessitats especials" i nou agent.',
  '{"reasons": ["Mencio de inclusio o necessitats especials (verificar)", "Nova activitat processada per l''agent"]}'::jsonb,
  5,
  NOW()
)
ON CONFLICT (id) DO NOTHING;
