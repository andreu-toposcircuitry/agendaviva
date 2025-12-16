// Main scraper functions
export {
  scrapeSource,
  scrapeAllSources,
  scrapeSingleUrl,
  type ScrapeOptions,
  type ScrapeResult,
} from './scraper.js';

// HTTP fetcher
export {
  fetchHtml,
  checkUrl,
  type FetchOptions,
} from './fetcher.js';

// Extractors
export {
  // Generic
  extractActivityBlocks,
  extractActivityLinks,
  isLikelyActivity,
  type ExtractedBlock,
  type ExtractorConfig,
  // Ajuntament
  extractFromAjuntament,
  extractActivityDetail,
  extractStructuredData,
  // Instagram (placeholder)
  extractFromInstagram,
  parseInstagramCaption,
  type InstagramPost,
  type InstagramConfig,
} from './extractors/index.js';

// Storage
export {
  getSupabaseClient,
  resetSupabaseClient,
  saveActivityFromAgent,
  getActiveSources,
  updateScrapingSource,
  logScrapingRun,
  type SaveActivityResult,
  type ScrapingSourceRecord,
} from './storage.js';
