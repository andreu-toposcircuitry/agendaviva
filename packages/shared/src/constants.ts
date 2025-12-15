// Tipologies d'activitats
export const TIPOLOGIES = {
  esports: {
    nom: 'Esports',
    icon: '⚽',
    subtipologies: ['futbol', 'bàsquet', 'natació', 'arts marcials', 'gimnàstica', 'atletisme', 'tennis', 'escalada', 'patinatge', 'altres']
  },
  arts: {
    nom: 'Arts Plàstiques i Visuals',
    icon: '🎨',
    subtipologies: ['pintura', 'dibuix', 'escultura', 'ceràmica', 'fotografia', 'arts digitals', 'manualitats']
  },
  musica: {
    nom: 'Música',
    icon: '🎵',
    subtipologies: ['instrument', 'cant', 'llenguatge musical', 'combo/banda', 'música i moviment', 'altres']
  },
  esceniques: {
    nom: 'Arts Escèniques',
    icon: '🎭',
    subtipologies: ['teatre', 'dansa', 'circ', 'expressió corporal', 'pallassos', 'màgia']
  },
  idiomes: {
    nom: 'Idiomes',
    icon: '🗣️',
    subtipologies: ['anglès', 'francès', 'alemany', 'xinès', 'altres']
  },
  reforç: {
    nom: 'Reforç i Tècniques d\'Estudi',
    icon: '📚',
    subtipologies: ['reforç escolar', 'tècniques estudi', 'deures dirigits', 'logopèdia', 'psicopedagogia']
  },
  ciencia_tech: {
    nom: 'Ciència i Tecnologia',
    icon: '🔬',
    subtipologies: ['robòtica', 'programació', 'minecraft educatiu', 'experiments', 'maker', 'electrònica']
  },
  natura: {
    nom: 'Natura i Medi Ambient',
    icon: '🌳',
    subtipologies: ['hort', 'observació natura', 'senderisme', 'educació ambiental', 'animals']
  },
  esplai: {
    nom: 'Esplai i Lleure',
    icon: '🎪',
    subtipologies: ['esplai', 'colònies', 'casals', 'ludoteca', 'celebracions']
  }
} as const;

export type TipologiaCodi = keyof typeof TIPOLOGIES;

// Municipis del Vallès Oriental
export const MUNICIPIS = [
  { id: 'granollers', nom: 'Granollers', codi_postal: ['08400', '08401', '08402'] },
  { id: 'mollet', nom: 'Mollet del Vallès', codi_postal: ['08100'] },
  { id: 'la-garriga', nom: 'La Garriga', codi_postal: ['08530'] },
  { id: 'cardedeu', nom: 'Cardedeu', codi_postal: ['08440'] },
  { id: 'les-franqueses', nom: 'Les Franqueses del Vallès', codi_postal: ['08520'] },
  { id: 'canovelles', nom: 'Canovelles', codi_postal: ['08420'] },
  { id: 'la-roca', nom: 'La Roca del Vallès', codi_postal: ['08430'] },
  { id: 'caldes-montbui', nom: 'Caldes de Montbui', codi_postal: ['08140'] },
  { id: 'sant-celoni', nom: 'Sant Celoni', codi_postal: ['08470'] },
  { id: 'llinars', nom: 'Llinars del Vallès', codi_postal: ['08450'] },
  { id: 'parets', nom: 'Parets del Vallès', codi_postal: ['08150'] },
  { id: 'montornes', nom: 'Montornès del Vallès', codi_postal: ['08170'] },
  { id: 'montmelo', nom: 'Montmeló', codi_postal: ['08160'] },
  { id: 'santa-eulalia', nom: 'Santa Eulàlia de Ronçana', codi_postal: ['08187'] },
  { id: 'bigues-riells', nom: 'Bigues i Riells', codi_postal: ['08415'] },
  { id: 'lliça-amunt', nom: 'Lliçà d\'Amunt', codi_postal: ['08186'] },
  { id: 'lliça-vall', nom: 'Lliçà de Vall', codi_postal: ['08185'] },
  { id: 'vilanova-valles', nom: 'Vilanova del Vallès', codi_postal: ['08410'] }
] as const;

// Tags comuns
export const TAGS_COMUNS = [
  'gratis',
  'beca_disponible',
  'accessible_cadira_rodes',
  'espai_sensorial',
  'petit_grup',
  'individual',
  'en_familia',
  'aire_lliure',
  'interior',
  'multilingüe',
  'catala',
  'castella',
  'angles',
  'competitiu',
  'no_competitiu',
  'flexibilitat_horari',
  'proves_gratuites',
  'material_inclòs'
] as const;

// Nivells ND
export const ND_NIVELLS = {
  1: { nom: 'Poc adequat', descripcio: 'Pot presentar moltes barreres per a persones ND' },
  2: { nom: 'Pot tenir barreres', descripcio: 'Algunes característiques poden ser un repte' },
  3: { nom: 'Neutre', descripcio: 'No hi ha indicadors clars en cap direcció' },
  4: { nom: 'Bastant adequat', descripcio: 'Té diverses característiques facilitadores' },
  5: { nom: 'Molt adequat', descripcio: 'Activitat altament recomanada per a perfils ND' }
} as const;

// Indicadors positius ND (exemples més comuns)
export const ND_INDICADORS_POSITIUS = [
  'Grups reduïts (màx 6-8 persones)',
  'Ritme flexible i adaptable',
  'Rutines estructurades i predictibles',
  'Material visual de suport',
  'Pauses sensorials disponibles',
  'Espai tranquil i poc sorollós',
  'Comunicació clara i directa',
  'Possibilitat d\'acompanyament familiar',
  'Activitats amb pausàs i descansos',
  'Professionals amb formació en neurodiversitat',
  'Absència de competició obligatòria',
  'Opcions d\'adaptació sensorial',
  'Comunicació prèvia de canvis',
  'Permetre auriculars o estimulació'
] as const;

// Indicadors negatius ND (exemples de barreres)
export const ND_INDICADORS_NEGATIUS = [
  'Grups molt grans (>15 persones)',
  'Ambient molt sorollós o caòtic',
  'Canvis constants i imprevistos',
  'Exigència alta de comunicació social',
  'Llums intermitents o molt intenses',
  'Competició obligatòria constant',
  'Ritme molt ràpid i inflexible',
  'Multitasca constant requerida',
  'Contacte físic freqüent obligatori',
  'Instruccions només verbals sense suport',
  'Sense possibilitat d\'adaptació',
  'Professors sense formació específica'
] as const;

// Quan es fa
export const QUAN_ES_FA_OPTIONS = [
  { value: 'setmanal', label: 'Setmanal' },
  { value: 'caps_de_setmana', label: 'Caps de setmana' },
  { value: 'intensiu_vacances', label: 'Intensiu vacances' },
  { value: 'puntual', label: 'Puntual' },
  { value: 'flexible', label: 'Flexible' }
] as const;

export const CURS_ACTUAL = '2025-2026';

export const DEFAULT_CONFIANCA = 75;
