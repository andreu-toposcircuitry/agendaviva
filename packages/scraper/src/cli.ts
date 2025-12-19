#!/usr/bin/env tsx
import { scrapeAllSources, scrapeSource, scrapeSingleUrl } from './scraper.js';
import { getSupabaseClient, getActiveSources } from './storage.js';
import { runDiscovery } from './discovery.js';

function printHelp() {
  console.log(`
Agenda Viva Scraper CLI
=======================

Usage:
  pnpm scrape                    Scrape all active sources
  pnpm scrape:dry                Dry run (no database changes)
  pnpm scrape <source-id>        Scrape a specific source by ID
  pnpm scrape --url <url>        Scrape a single URL (for testing)
  pnpm scrape --list             List all active sources

Options:
  --dry-run, -d    Don't save to database
  --verbose, -v    Show detailed output
  --help, -h       Show this help message
  --concurrency N  Number of concurrent sources (default: 3)
  --max-blocks N   Max blocks per source (default: 20)

Environment:
  SUPABASE_URL         Supabase project URL
  SUPABASE_SERVICE_KEY Supabase service role key
  ANTHROPIC_API_KEY    Anthropic API key for classification
`);
}

async function listSources() {
  try {
    const sources = await getActiveSources();
    console.log('\nActive Scraping Sources:');
    console.log('========================\n');

    if (sources.length === 0) {
      console.log('No active sources found.');
      return;
    }

    for (const source of sources) {
      console.log(`ID: ${source.id}`);
      console.log(`  Name: ${source.nom}`);
      console.log(`  URL: ${source.url}`);
      console.log(`  Type: ${source.tipus}`);
      console.log('');
    }
  } catch (err) {
    console.error('Error listing sources:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const showHelp = args.includes('--help') || args.includes('-h');
  const showList = args.includes('--list');
  const runDiscoverMode = args.includes('discover');

  if (showHelp) {
    printHelp();
    process.exit(0);
  }

  // Handle discover command
  if (runDiscoverMode) {
    try {
      await runDiscovery();
      process.exit(0);
    } catch (err) {
      console.error('\nDiscovery error:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  // Parse options
  let concurrency = 3;
  let maxBlocks = 20;
  let testUrl: string | undefined;

  const concurrencyIdx = args.indexOf('--concurrency');
  if (concurrencyIdx !== -1 && args[concurrencyIdx + 1]) {
    concurrency = parseInt(args[concurrencyIdx + 1], 10);
  }

  const maxBlocksIdx = args.indexOf('--max-blocks');
  if (maxBlocksIdx !== -1 && args[maxBlocksIdx + 1]) {
    maxBlocks = parseInt(args[maxBlocksIdx + 1], 10);
  }

  const urlIdx = args.indexOf('--url');
  if (urlIdx !== -1 && args[urlIdx + 1]) {
    testUrl = args[urlIdx + 1];
  }

  // Get positional argument (source ID)
  const positionalArgs = args.filter(
    (a) => !a.startsWith('-') &&
      args.indexOf(a) !== concurrencyIdx + 1 &&
      args.indexOf(a) !== maxBlocksIdx + 1 &&
      args.indexOf(a) !== urlIdx + 1
  );
  const sourceId = positionalArgs[0];

  // Print header
  console.log('');
  console.log('Agenda Viva Scraper');
  console.log('===================');
  if (dryRun) console.log('MODE: Dry run (no database changes)\n');

  try {
    // Handle --list
    if (showList) {
      await listSources();
      process.exit(0);
    }

    // Handle --url (single URL test)
    if (testUrl) {
      console.log(`Testing URL: ${testUrl}\n`);
      const result = await scrapeSingleUrl(testUrl, {
        dryRun: true,
        verbose: true,
        maxBlocksPerSource: maxBlocks,
      });
      printSummary([result]);
      process.exit(result.errors.length > 0 ? 1 : 0);
    }

    let results;

    if (sourceId) {
      // Scrape single source by ID
      const sb = getSupabaseClient();
      const { data: source, error } = await sb
        .from('fonts_scraping')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (error || !source) {
        console.error(`Source not found: ${sourceId}`);
        console.log('\nUse --list to see available sources.');
        process.exit(1);
      }

      console.log(`Scraping source: ${source.nom}\n`);
      results = [await scrapeSource(source, { dryRun, verbose, maxBlocksPerSource: maxBlocks })];
    } else {
      // Scrape all sources
      console.log(`Scraping all active sources (concurrency: ${concurrency})...\n`);
      results = await scrapeAllSources({
        dryRun,
        verbose,
        concurrency,
        maxBlocksPerSource: maxBlocks,
      });
    }

    // Print summary
    printSummary(results);

    // Exit with error code if there were any errors
    const hasErrors = results.some((r) => r.errors.length > 0);
    process.exit(hasErrors ? 1 : 0);
  } catch (err) {
    console.error('\nFatal error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

function printSummary(results: Awaited<ReturnType<typeof scrapeAllSources>>) {
  console.log('\n');
  console.log('='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  let totalCreated = 0;
  let totalQueued = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  let totalDurationMs = 0;

  for (const r of results) {
    console.log(`\n${r.source}:`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Blocks found: ${r.blocksFound}`);
    console.log(`  Blocks processed: ${r.blocksProcessed}`);
    console.log(`  Activities created: ${r.activitiesCreated}`);
    console.log(`  Activities queued: ${r.activitiesQueued}`);
    console.log(`  Duplicates skipped: ${r.duplicatesSkipped}`);
    console.log(`  Duration: ${(r.durationMs / 1000).toFixed(2)}s`);

    if (r.errors.length) {
      console.log(`  Errors (${r.errors.length}):`);
      r.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
      if (r.errors.length > 5) {
        console.log(`    ... and ${r.errors.length - 5} more`);
      }
    }

    totalCreated += r.activitiesCreated;
    totalQueued += r.activitiesQueued;
    totalDuplicates += r.duplicatesSkipped;
    totalErrors += r.errors.length;
    totalDurationMs += r.durationMs;
  }

  console.log('\n' + '='.repeat(50));
  console.log('TOTALS');
  console.log('='.repeat(50));
  console.log(`Sources processed: ${results.length}`);
  console.log(`Activities created: ${totalCreated}`);
  console.log(`Activities queued for review: ${totalQueued}`);
  console.log(`Duplicates skipped: ${totalDuplicates}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Total duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log('');
}

main();
