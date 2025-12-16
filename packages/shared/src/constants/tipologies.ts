export const TIPOLOGIES = {
  arts: {
    codi: 'arts',
    nom: 'Arts',
    descripcio: 'Música, dansa, teatre, arts plàstiques, circ',
    icona: '🎨',
    color: '#8B5CF6',
    subtipologies: ['musica', 'dansa', 'teatre', 'arts_plastiques', 'circ', 'audiovisuals'],
  },
  esports: {
    codi: 'esports',
    nom: 'Esports',
    descripcio: "Esports individuals i d'equip, arts marcials",
    icona: '⚽',
    color: '#10B981',
    subtipologies: ['futbol', 'basquet', 'natacio', 'arts_marcials', 'gimnastica'],
  },
  natura_ciencia: {
    codi: 'natura_ciencia',
    nom: 'Natura i Ciència',
    descripcio: 'Ciència, tecnologia, robòtica, medi ambient',
    icona: '🔬',
    color: '#06B6D4',
    subtipologies: ['robotica', 'programacio', 'ciencia', 'natura', 'astronomia'],
  },
  cultura_popular: {
    codi: 'cultura_popular',
    nom: 'Cultura Popular',
    descripcio: 'Castells, gegants, diables, sardanes',
    icona: '🎭',
    color: '#F59E0B',
    subtipologies: ['castells', 'gegants', 'diables', 'sardanes', 'folklore'],
  },
  llengua_cultura: {
    codi: 'llengua_cultura',
    nom: 'Llengua i Cultura',
    descripcio: 'Idiomes, literatura, escriptura',
    icona: '📚',
    color: '#EC4899',
    subtipologies: ['catala', 'angles', 'literatura', 'escriptura'],
  },
  lleure: {
    codi: 'lleure',
    nom: 'Lleure',
    descripcio: 'Esplais, caus, agrupaments, ludoteques',
    icona: '🏕️',
    color: '#22C55E',
    subtipologies: ['esplai', 'cau', 'agrupament', 'ludoteca', 'casal'],
  },
  social_comunitari: {
    codi: 'social_comunitari',
    nom: 'Social i Comunitari',
    descripcio: 'Voluntariat, participació, projectes comunitaris',
    icona: '🤝',
    color: '#F97316',
    subtipologies: ['voluntariat', 'participacio', 'comunitari'],
  },
  accio_social: {
    codi: 'accio_social',
    nom: 'Acció Social',
    descripcio: "Projectes d'inclusió, diversitat funcional",
    icona: '💚',
    color: '#14B8A6',
    subtipologies: ['inclusio', 'diversitat_funcional', 'suport'],
  },
  educacio_reforc: {
    codi: 'educacio_reforc',
    nom: 'Educació i Reforç',
    descripcio: "Reforç escolar, tècniques d'estudi",
    icona: '📖',
    color: '#6366F1',
    subtipologies: ['reforc_escolar', 'tecniques_estudi', 'logopedia'],
  },
} as const;

export type TipologiaCodi = keyof typeof TIPOLOGIES;
export type Tipologia = (typeof TIPOLOGIES)[TipologiaCodi];

export const TIPOLOGIA_CODIS = Object.keys(TIPOLOGIES) as TipologiaCodi[];

export const TIPOLOGIA_THRESHOLD = 70;
export const MAX_TIPOLOGIES = 3;

export function getTipologia(codi: TipologiaCodi): Tipologia {
  return TIPOLOGIES[codi];
}

export function getTipologiaNom(codi: TipologiaCodi): string {
  return TIPOLOGIES[codi].nom;
}
