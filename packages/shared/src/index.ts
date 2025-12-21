// Constants
export {
  // Tipologies
  TIPOLOGIES,
  TIPOLOGIA_CODIS,
  TIPOLOGIA_THRESHOLD,
  MAX_TIPOLOGIES,
  getTipologia,
  getTipologiaNom,
  type TipologiaCodi,
  type Tipologia,
  // ND Levels
  ND_LEVELS,
  getNDLevel,
  getNDLevelByCode,
  isValidNDScore,
  type NDScore,
  type NDNivellCodi,
  type NDLevel,
  // Municipis
  MUNICIPIS,
  MUNICIPI_IDS,
  getMunicipi,
  getMunicipiByPostalCode,
  searchMunicipis,
  type MunicipiId,
  type Municipi,
  // Quan es fa
  QUAN_ES_FA,
  QUAN_ES_FA_CODIS,
  getQuanEsFa,
  type QuanEsFaCodi,
  type QuanEsFa,
  // Tags
  TAG_CATEGORIES,
  TAGS,
  TAG_IDS,
  getTag,
  getTagsByCategory,
  isValidTagId,
  type TagCategoria,
  type TagId,
  type Tag,
} from './constants/index.js';

// Types
export type {
  // Activitat
  TipologiaAmbScore,
  ActivitatEstat,
  NDVerificatPer,
  PreuPeriode,
  FontTipus,
  Activitat,
  ActivitatPublic,
  ActivitatInput,
  // Agent
  AgentInput,
  AgentTipologiaResult,
  AgentNDResult,
  AgentActivitatResult,
  AgentOutput,
  AgentProcessingStatus,
  AgentTask,
  AgentConfig,
  // Entitat
  EntitatTipus,
  Entitat,
  EntitatPublic,
  EntitatInput,
  EntitatClaim,
} from './types/index.js';

// Validators
export {
  // Activitat
  tipologiaAmbScoreSchema,
  activitatEstatSchema,
  ndVerificatPerSchema,
  preuPeriodeSchema,
  fontTipusSchema,
  activitatInputSchema,
  activitatSchema,
  type ActivitatInputSchema,
  type ActivitatSchema,
  // Entitat
  entitatTipusSchema,
  entitatInputSchema,
  entitatSchema,
  type EntitatInputSchema,
  type EntitatSchema,
  // Agent
  agentInputSchema,
  agentTipologiaResultSchema,
  agentNDResultSchema,
  agentActivitatResultSchema,
  agentOutputSchema,
  type AgentInputSchema,
  type AgentOutputSchema,
} from './validators/index.js';

// Utils
export {
  generateSlug,
  generateUniqueSlug,
  isValidSlug,
  formatEdatRange,
  formatPreu,
  formatPreuRange,
  formatDate,
  formatDateRange,
  truncateText,
  capitalizeFirst,
} from './utils/index.js';

// Environment validation
export {
  webEnvSchema,
  agentEnvSchema,
  scraperEnvSchema,
  validateEnv,
  checkRequiredEnv,
  type WebEnv,
  type AgentEnv,
  type ScraperEnv,
} from './env.js';
