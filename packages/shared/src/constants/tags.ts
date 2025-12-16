export const TAG_CATEGORIES = {
  valors: { nom: 'Valors', descripcio: 'Valors i principis pedagògics' },
  format: { nom: 'Format', descripcio: 'Característiques del format' },
  nd: { nom: 'Neurodiversitat', descripcio: 'Adaptacions per neurodiversitat' },
  servei: { nom: 'Serveis', descripcio: 'Serveis addicionals' },
} as const;

export type TagCategoria = keyof typeof TAG_CATEGORIES;

export const TAGS = {
  'valors:cooperatiu': { id: 'valors:cooperatiu', nom: 'Cooperatiu', categoria: 'valors' as const },
  'valors:inclusiu': { id: 'valors:inclusiu', nom: 'Inclusiu', categoria: 'valors' as const },
  'valors:respectuos': { id: 'valors:respectuos', nom: 'Respectuós', categoria: 'valors' as const },
  'valors:no_competitiu': { id: 'valors:no_competitiu', nom: 'No competitiu', categoria: 'valors' as const },
  'format:grups_reduits': { id: 'format:grups_reduits', nom: 'Grups reduïts', categoria: 'format' as const },
  'format:aire_lliure': { id: 'format:aire_lliure', nom: "A l'aire lliure", categoria: 'format' as const },
  'format:online': { id: 'format:online', nom: 'Online', categoria: 'format' as const },
  'format:presencial': { id: 'format:presencial', nom: 'Presencial', categoria: 'format' as const },
  'nd:adaptat_tdah': { id: 'nd:adaptat_tdah', nom: 'Adaptat TDAH', categoria: 'nd' as const },
  'nd:adaptat_tea': { id: 'nd:adaptat_tea', nom: 'Adaptat TEA', categoria: 'nd' as const },
  'nd:sensorial_friendly': { id: 'nd:sensorial_friendly', nom: 'Sensorial friendly', categoria: 'nd' as const },
  'nd:estructura_clara': { id: 'nd:estructura_clara', nom: 'Estructura clara', categoria: 'nd' as const },
  'servei:beques': { id: 'servei:beques', nom: 'Beques disponibles', categoria: 'servei' as const },
  'servei:transport': { id: 'servei:transport', nom: 'Transport', categoria: 'servei' as const },
  'servei:menjador': { id: 'servei:menjador', nom: 'Menjador', categoria: 'servei' as const },
} as const;

export type TagId = keyof typeof TAGS;
export type Tag = (typeof TAGS)[TagId];

export const TAG_IDS = Object.keys(TAGS) as TagId[];

export function getTag(id: TagId): Tag {
  return TAGS[id];
}

export function getTagsByCategory(categoria: TagCategoria): Tag[] {
  return Object.values(TAGS).filter((tag) => tag.categoria === categoria);
}

export function isValidTagId(id: string): id is TagId {
  return id in TAGS;
}
