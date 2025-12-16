export const QUAN_ES_FA = {
  setmanal: {
    codi: 'setmanal',
    nom: 'Setmanal',
    descripcio: 'Activitat regular durant la setmana',
    icona: '📅',
  },
  caps_de_setmana: {
    codi: 'caps_de_setmana',
    nom: 'Caps de setmana',
    descripcio: 'Dissabtes i/o diumenges',
    icona: '🌅',
  },
  intensiu_vacances: {
    codi: 'intensiu_vacances',
    nom: 'Intensiu vacances',
    descripcio: 'Casals, colònies, campus estivals',
    icona: '☀️',
  },
  puntual: {
    codi: 'puntual',
    nom: 'Puntual',
    descripcio: 'Activitat única o esporàdica',
    icona: '📌',
  },
  flexible: {
    codi: 'flexible',
    nom: 'Flexible',
    descripcio: 'Horaris adaptables',
    icona: '🔄',
  },
} as const;

export type QuanEsFaCodi = keyof typeof QUAN_ES_FA;
export type QuanEsFa = (typeof QUAN_ES_FA)[QuanEsFaCodi];

export const QUAN_ES_FA_CODIS = Object.keys(QUAN_ES_FA) as QuanEsFaCodi[];

export function getQuanEsFa(codi: QuanEsFaCodi): QuanEsFa {
  return QUAN_ES_FA[codi];
}
