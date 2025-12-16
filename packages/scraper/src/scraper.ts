import pLimit from 'p-limit';
import { classifyActivity } from '@agendaviva/agent';
import { fetchHtml } from './fetcher.js';
import { extractActivityBlocks, extractFromAjuntament, isLikelyActivity } from './extractors/index.js';
import {
  saveActivityFromAgent,
  getActiveSources,
  updateScrapingSource,
  logScrapingRun,
  type ScrapingSourceRecord,
} from './storage.js';

export interface ScrapeOptions {
  concurrency?: number;
  dryRun?: boolean;
  verbose?: boolean;
  maxBlocksPerSource?: number;
}

export interface ScrapeResult {
  source: string;
  url: string;
  blocksFound: number;
  blocksProcessed: number;
  activitiesCreated: number;
  activitiesQueued: number;
  duplicatesSkipped: number;
  errors: string[];
  durationMs: number;
}

/**
 * Scrape a single source
 */
export async function scrapeSource(
  source: ScrapingSourceRecord,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const { dryRun = false, verbose = false, maxBlocksPerSource = 20 } = options;

  const result: ScrapeResult = {
    source: source.nom,
    url: source.url,
    blocksFound: 0,
    blocksProcessed: 0,
    activitiesCreated: 0,
    activitiesQueued: 0,
    duplicatesSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    // 1. Fetch HTML
    if (verbose) console.log(`[${source.nom}] Fetching ${source.url}...`);
    const html = await fetchHtml(source.url);

    // 2. Extract blocks based on source type
    let blocks = source.tipus === 'ajuntament'
      ? extractFromAjuntament(html, source.url)
      : extractActivityBlocks(html, source.url);

    result.blocksFound = blocks.length;
    if (verbose) console.log(`[${source.nom}] Found ${blocks.length} blocks`);

    // 3. Filter likely activities
    const likelyActivities = blocks.filter((b) => isLikelyActivity(b.text));
    if (verbose) console.log(`[${source.nom}] ${likelyActivities.length} likely activities`);

    // 4. Limit blocks to process
    const toProcess = likelyActivities.slice(0, maxBlocksPerSource);

    // 5. Process each block
    for (const block of toProcess) {
      result.blocksProcessed++;

      try {
        if (verbose) {
          console.log(`[${source.nom}] Processing block ${result.blocksProcessed}/${toProcess.length}...`);
        }

        // Classify with agent
        const classification = await classifyActivity({
          text: block.text,
          sourceUrl: block.url || source.url,
          sourceType: 'scraping',
        });

        if (!classification.success || !classification.output) {
          result.errors.push(`Classification failed: ${classification.error}`);
          continue;
        }

        if (verbose) {
          console.log(`[${source.nom}] Classified as: ${classification.output.activitat.nom}`);
        }

        if (dryRun) {
          console.log(`[DRY RUN] Would save: ${classification.output.activitat.nom}`);
          console.log(`  - Tipologies: ${classification.output.activitat.tipologies.map((t) => t.codi).join(', ')}`);
          console.log(`  - ND Score: ${classification.output.nd.score}`);
          console.log(`  - Confidence: ${classification.output.confianca}%`);
          console.log(`  - Needs review: ${classification.output.needsReview}`);
          result.activitiesCreated++;
          continue;
        }

        // Save to database
        const saveResult = await saveActivityFromAgent(
          classification.output,
          block.url || source.url,
          block.text
        );

        if (saveResult.success) {
          if (saveResult.cuaId) {
            result.activitiesQueued++;
          } else {
            result.activitiesCreated++;
          }
        } else if (saveResult.isDuplicate) {
          result.duplicatesSkipped++;
          if (verbose) {
            console.log(`[${source.nom}] Skipped duplicate: ${saveResult.error}`);
          }
        } else {
          result.errors.push(`Save failed: ${saveResult.error}`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Block processing error: ${errMsg}`);
        if (verbose) {
          console.error(`[${source.nom}] Error processing block:`, errMsg);
        }
      }
    }

    // 6. Update source status
    result.durationMs = Date.now() - startTime;

    if (!dryRun) {
      await updateScrapingSource(source.id, {
        success: true,
        itemsFound: result.activitiesCreated + result.activitiesQueued,
      });

      await logScrapingRun(source.id, {
        blocksFound: result.blocksFound,
        activitiesCreated: result.activitiesCreated,
        activitiesQueued: result.activitiesQueued,
        errors: result.errors,
        durationMs: result.durationMs,
      });
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(error);
    result.durationMs = Date.now() - startTime;

    if (!dryRun) {
      await updateScrapingSource(source.id, {
        success: false,
        itemsFound: 0,
        error,
      });
    }
  }

  return result;
}

/**
 * Scrape all active sources
 */
export async function scrapeAllSources(options: ScrapeOptions = {}): Promise<ScrapeResult[]> {
  const { concurrency = 3, verbose = false } = options;

  // Get active sources
  const sources = await getActiveSources();

  if (!sources.length) {
    if (verbose) console.log('No active sources found');
    return [];
  }

  if (verbose) console.log(`Scraping ${sources.length} sources with concurrency ${concurrency}...`);

  // Process with concurrency limit
  const limit = pLimit(concurrency);
  const results = await Promise.all(
    sources.map((source) =>
      limit(() => scrapeSource(source, options))
    )
  );

  return results;
}

/**
 * Scrape a single URL (for testing/debugging)
 */
export async function scrapeSingleUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const mockSource: ScrapingSourceRecord = {
    id: 'test',
    nom: 'Test URL',
    url,
    tipus: 'generic',
    activa: true,
  };

  return scrapeSource(mockSource, { ...options, dryRun: true });
}
