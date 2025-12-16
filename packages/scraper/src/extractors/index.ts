// Generic extractor
export {
  extractActivityBlocks,
  extractActivityLinks,
  isLikelyActivity,
  type ExtractedBlock,
  type ExtractorConfig,
} from './generic.js';

// Ajuntament (municipal) extractor
export {
  extractFromAjuntament,
  extractActivityDetail,
  extractStructuredData,
} from './ajuntament.js';

// Instagram extractor (placeholder)
export {
  extractFromInstagram,
  parseInstagramCaption,
  type InstagramPost,
  type InstagramConfig,
} from './instagram.js';
