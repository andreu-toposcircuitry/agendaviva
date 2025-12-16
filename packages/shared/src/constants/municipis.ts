export const MUNICIPIS = {
  ametlla: { id: 'ametlla', nom: "L'Ametlla del Vallès", codisPostals: ['08480'], poblacio: 8800 },
  'bigues-riells': { id: 'bigues-riells', nom: 'Bigues i Riells', codisPostals: ['08415'], poblacio: 9200 },
  'caldes-montbui': { id: 'caldes-montbui', nom: 'Caldes de Montbui', codisPostals: ['08140'], poblacio: 17500 },
  campins: { id: 'campins', nom: 'Campins', codisPostals: ['08479'], poblacio: 500 },
  canovelles: { id: 'canovelles', nom: 'Canovelles', codisPostals: ['08420'], poblacio: 16500 },
  cardedeu: { id: 'cardedeu', nom: 'Cardedeu', codisPostals: ['08440'], poblacio: 18500 },
  castellcir: { id: 'castellcir', nom: 'Castellcir', codisPostals: ['08183'], poblacio: 700 },
  castelltercol: { id: 'castelltercol', nom: 'Castellterçol', codisPostals: ['08183'], poblacio: 2400 },
  'fogars-montclus': { id: 'fogars-montclus', nom: 'Fogars de Montclús', codisPostals: ['08479'], poblacio: 450 },
  garriga: { id: 'garriga', nom: 'La Garriga', codisPostals: ['08530'], poblacio: 16500 },
  granera: { id: 'granera', nom: 'Granera', codisPostals: ['08183'], poblacio: 80 },
  granollers: {
    id: 'granollers',
    nom: 'Granollers',
    codisPostals: ['08400', '08401', '08402', '08403'],
    poblacio: 61500,
  },
  gualba: { id: 'gualba', nom: 'Gualba', codisPostals: ['08474'], poblacio: 1500 },
  llagosta: { id: 'llagosta', nom: 'La Llagosta', codisPostals: ['08120'], poblacio: 13800 },
  'les-franqueses': { id: 'les-franqueses', nom: 'Les Franqueses del Vallès', codisPostals: ['08520'], poblacio: 20000 },
  'llica-amunt': { id: 'llica-amunt', nom: "Lliçà d'Amunt", codisPostals: ['08186'], poblacio: 15500 },
  'llica-vall': { id: 'llica-vall', nom: 'Lliçà de Vall', codisPostals: ['08185'], poblacio: 6500 },
  llinars: { id: 'llinars', nom: 'Llinars del Vallès', codisPostals: ['08450'], poblacio: 10500 },
  martorelles: { id: 'martorelles', nom: 'Martorelles', codisPostals: ['08107'], poblacio: 5200 },
  mollet: { id: 'mollet', nom: 'Mollet del Vallès', codisPostals: ['08100'], poblacio: 51500 },
  montmelo: { id: 'montmelo', nom: 'Montmeló', codisPostals: ['08160'], poblacio: 10000 },
  montornes: { id: 'montornes', nom: 'Montornès del Vallès', codisPostals: ['08170'], poblacio: 16500 },
  montseny: { id: 'montseny', nom: 'Montseny', codisPostals: ['08469'], poblacio: 350 },
  parets: { id: 'parets', nom: 'Parets del Vallès', codisPostals: ['08150'], poblacio: 19000 },
  roca: { id: 'roca', nom: 'La Roca del Vallès', codisPostals: ['08430'], poblacio: 11000 },
  'sant-antoni-vilamajor': {
    id: 'sant-antoni-vilamajor',
    nom: 'Sant Antoni de Vilamajor',
    codisPostals: ['08459'],
    poblacio: 6500,
  },
  'sant-celoni': { id: 'sant-celoni', nom: 'Sant Celoni', codisPostals: ['08470'], poblacio: 18500 },
  'sant-esteve-palautordera': {
    id: 'sant-esteve-palautordera',
    nom: 'Sant Esteve de Palautordera',
    codisPostals: ['08461'],
    poblacio: 2800,
  },
  'sant-feliu-codines': {
    id: 'sant-feliu-codines',
    nom: 'Sant Feliu de Codines',
    codisPostals: ['08182'],
    poblacio: 6200,
  },
  'sant-fost-campsentelles': {
    id: 'sant-fost-campsentelles',
    nom: 'Sant Fost de Campsentelles',
    codisPostals: ['08105'],
    poblacio: 8800,
  },
  'sant-pere-vilamajor': {
    id: 'sant-pere-vilamajor',
    nom: 'Sant Pere de Vilamajor',
    codisPostals: ['08458'],
    poblacio: 4500,
  },
  'sant-quirze-safaja': { id: 'sant-quirze-safaja', nom: 'Sant Quirze Safaja', codisPostals: ['08189'], poblacio: 700 },
  'santa-eulalia-roncana': {
    id: 'santa-eulalia-roncana',
    nom: 'Santa Eulàlia de Ronçana',
    codisPostals: ['08187'],
    poblacio: 7500,
  },
  'santa-maria-martorelles': {
    id: 'santa-maria-martorelles',
    nom: 'Santa Maria de Martorelles',
    codisPostals: ['08106'],
    poblacio: 900,
  },
  'santa-maria-palautordera': {
    id: 'santa-maria-palautordera',
    nom: 'Santa Maria de Palautordera',
    codisPostals: ['08460'],
    poblacio: 9500,
  },
  tagamanent: { id: 'tagamanent', nom: 'Tagamanent', codisPostals: ['08593'], poblacio: 350 },
  vallgorguina: { id: 'vallgorguina', nom: 'Vallgorguina', codisPostals: ['08471'], poblacio: 3000 },
  vallromanes: { id: 'vallromanes', nom: 'Vallromanes', codisPostals: ['08188'], poblacio: 2600 },
  'vilalba-sasserra': { id: 'vilalba-sasserra', nom: 'Vilalba Sasserra', codisPostals: ['08455'], poblacio: 750 },
  'vilanova-valles': { id: 'vilanova-valles', nom: 'Vilanova del Vallès', codisPostals: ['08410'], poblacio: 5500 },
} as const;

export type MunicipiId = keyof typeof MUNICIPIS;
export type Municipi = (typeof MUNICIPIS)[MunicipiId];

export const MUNICIPI_IDS = Object.keys(MUNICIPIS) as MunicipiId[];

export function getMunicipi(id: string): Municipi | undefined {
  return MUNICIPIS[id as MunicipiId];
}

export function getMunicipiByPostalCode(codiPostal: string): Municipi | undefined {
  const municipis = Object.values(MUNICIPIS) as Municipi[];
  return municipis.find((m) => (m.codisPostals as readonly string[]).includes(codiPostal));
}

export function searchMunicipis(query: string): Municipi[] {
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const municipis = Object.values(MUNICIPIS) as Municipi[];
  return municipis.filter((m) => {
    const normalizedNom = m.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedNom.includes(normalizedQuery);
  });
}
