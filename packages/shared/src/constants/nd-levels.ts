export const ND_LEVELS = {
  5: {
    score: 5,
    codi: 'nd_excellent',
    nom: 'ND-Excel·lent',
    descripcio: 'Dissenyada explícitament per ser inclusiva',
    icona: '✓✓',
    color: '#15803d',
    criteris: [
      "Menció explícita d'adaptacions",
      'Grups reduïts (màx 8-10)',
      'Espais amb consideració sensorial',
      'Personal amb formació en ND',
    ],
  },
  4: {
    score: 4,
    codi: 'nd_preparat',
    nom: 'ND-Preparat',
    descripcio: 'Estructures naturalment compatibles',
    icona: '✓',
    color: '#22c55e',
    criteris: ['Estructura clara', 'Horaris fixes', 'Ratio favorable', 'Ambient tranquil'],
  },
  3: {
    score: 3,
    codi: 'nd_compatible',
    nom: 'ND-Compatible',
    descripcio: 'Pot funcionar sense garanties',
    icona: '○',
    color: '#6b7280',
    criteris: ['Activitat estructurada', 'Depèn del monitor'],
  },
  2: {
    score: 2,
    codi: 'nd_variable',
    nom: 'ND-Variable',
    descripcio: 'Presenta reptes potencials',
    icona: '△',
    color: '#f59e0b',
    criteris: ['Alta variabilitat', 'Grups grans', 'Potencialment sobreestimulant'],
  },
  1: {
    score: 1,
    codi: 'nd_desafiador',
    nom: 'ND-Desafiador',
    descripcio: 'Probablement difícil',
    icona: '⚠',
    color: '#ef4444',
    criteris: ['Alta sobreestimulació', 'Molt impredictible', 'Competició intensa'],
  },
} as const;

export type NDScore = 1 | 2 | 3 | 4 | 5;
export type NDNivellCodi = 'nd_excellent' | 'nd_preparat' | 'nd_compatible' | 'nd_variable' | 'nd_desafiador';
export type NDLevel = (typeof ND_LEVELS)[NDScore];

export function getNDLevel(score: number): NDLevel | undefined {
  if (score < 1 || score > 5) return undefined;
  return ND_LEVELS[score as NDScore];
}

export function getNDLevelByCode(codi: NDNivellCodi): NDLevel | undefined {
  return Object.values(ND_LEVELS).find((level) => level.codi === codi);
}

export function isValidNDScore(score: number): score is NDScore {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}
