export {
  TIPOLOGIES,
  TIPOLOGIA_CODIS,
  TIPOLOGIA_THRESHOLD,
  MAX_TIPOLOGIES,
  getTipologia,
  getTipologiaNom,
  type TipologiaCodi,
  type Tipologia,
} from './tipologies.js';

export {
  ND_LEVELS,
  getNDLevel,
  getNDLevelByCode,
  isValidNDScore,
  type NDScore,
  type NDNivellCodi,
  type NDLevel,
} from './nd-levels.js';

export {
  MUNICIPIS,
  MUNICIPI_IDS,
  getMunicipi,
  getMunicipiByPostalCode,
  searchMunicipis,
  type MunicipiId,
  type Municipi,
} from './municipis.js';

export {
  QUAN_ES_FA,
  QUAN_ES_FA_CODIS,
  getQuanEsFa,
  type QuanEsFaCodi,
  type QuanEsFa,
} from './quan-es-fa.js';

export {
  TAG_CATEGORIES,
  TAGS,
  TAG_IDS,
  getTag,
  getTagsByCategory,
  isValidTagId,
  type TagCategoria,
  type TagId,
  type Tag,
} from './tags.js';
