import { createClient } from '@supabase/supabase-js';
import { MUNICIPIS } from '@agendaviva/shared';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Configuration constants
const RATE_LIMIT_DELAY_MS = 800; // Delay between API calls to be polite
const TITLE_LENGTH_DB = 50; // Max title length for database storage
const TITLE_LENGTH_LOG = 40; // Max title length for log display

// Initialize Supabase (if keys are present)
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

// Helper: Sleep to avoid hitting API rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search the web for events using Brave Search API
 * Uses freshness=py (Past Year) filter to only get recently updated pages
 */
// Track API stats for summary
let braveApiCalls = 0;
let braveApiErrors = 0;
let braveApiResults = 0;

export async function searchWebForEvents(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    return [];
  }

  braveApiCalls++;

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=ES&search_lang=ca&freshness=py`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      braveApiErrors++;
      // Log first few errors in detail
      if (braveApiErrors <= 3) {
        const body = await response.text().catch(() => '');
        console.error(`❌ Brave API Error ${response.status}: ${response.statusText}`);
        console.error(`   Query: "${query}"`);
        console.error(`   Response: ${body.substring(0, 200)}`);
      }
      return [];
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results || [];
    braveApiResults += results.length;

    return results.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (error) {
    braveApiErrors++;
    if (braveApiErrors <= 3) {
      console.error('❌ Brave API Exception:', error instanceof Error ? error.message : error);
    }
    return [];
  }
}

export function getBraveApiStats() {
  return { calls: braveApiCalls, errors: braveApiErrors, results: braveApiResults };
}

/**
 * Run a discovery cycle and SAVE to Supabase
 * This searches ALL municipalities in Vallès Oriental for children's activities
 */
export async function runDiscovery() {
  // === DIAGNOSTIC OUTPUT ===
  console.log('='.repeat(50));
  console.log('DISCOVERY DIAGNOSTICS');
  console.log('='.repeat(50));
  console.log(`BRAVE_API_KEY: ${BRAVE_API_KEY ? '✅ Set (' + BRAVE_API_KEY.substring(0, 8) + '...)' : '❌ MISSING'}`);
  console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ MISSING'}`);
  console.log(`SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ MISSING'}`);
  console.log('='.repeat(50));

  if (!BRAVE_API_KEY) {
    console.error('❌ BRAVE_API_KEY is missing! Discovery cannot search for sources.');
    console.error('   Please add BRAVE_API_KEY to your GitHub repository secrets.');
    return;
  }

  if (!supabase) {
    console.error('❌ Supabase keys missing. Cannot save discovered sources.');
    return;
  }

  // Test Supabase connection
  console.log('\n🔍 Testing Supabase connection...');
  const { count, error: countError } = await supabase
    .from('fonts_scraping')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Supabase connection failed:', countError.message);
    console.error('   This might be an RLS policy issue. Check fonts_scraping policies.');
    return;
  }
  console.log(`✅ Supabase connected. Current sources in DB: ${count}`);

  // Use the full list of municipalities from the shared package
  const municipios = Object.values(MUNICIPIS) as Array<{ id: string; nom: string; codisPostals: string[]; poblacio: number }>;
  
  // 2. Specific keywords for children's activities + Current Year to ensure fresh content
  const currentYear = new Date().getFullYear(); // e.g., 2025
  const keywords = [
    `activitats extraescolars ${currentYear}`,
    `agenda infantil ${currentYear}`,
    `casals estiu ${currentYear}`,
    `tallers per a nens ${currentYear}`,
    `escola de música ${currentYear}`,
    `club esportiu ${currentYear}`,
    `agenda cultural ${currentYear}`,
    `actividades para niños ${currentYear}`, // Added Spanish
    `extraescolares ${currentYear}`          // Added Spanish
  ];

  console.log(`🚀 Starting Smart Discovery (Fresh Content Only) for ${municipios.length} municipalities...`);
  
  let totalAdded = 0;
  let totalActivated = 0;

  for (const muni of municipios) {
    console.log(`\n📍 Checking ${muni.nom}...`);
    
    for (const keyword of keywords) {
      const query = `${keyword} ${muni.nom}`;
      
      // Be polite to the API
      await sleep(RATE_LIMIT_DELAY_MS);

      const results = await searchWebForEvents(query);
      
      for (const result of results) {
        // Skip generic domains like wikipedia, facebook login, etc.
        if (result.url.includes('wikipedia.org') || result.url.includes('facebook.com/login')) {
          continue;
        }

        const { data: existing } = await supabase
          .from('fonts_scraping')
          .select('id, activa, notes')
          .eq('url', result.url)
          .single();

        if (!existing) {
          // INSERT NEW AS ACTIVE (so scraper can process it immediately)
          const { error } = await supabase
            .from('fonts_scraping')
            .insert({
              nom: `[${muni.nom}] ${result.title.substring(0, TITLE_LENGTH_DB)}`,
              url: result.url,
              tipus: 'web',
              activa: true, // <--- FIXED: Now defaults to TRUE so scraper sees it
              prioritat: 5,
              notes: `Discovered via "${query}" (Fresh content from ${currentYear})\n${result.description}`
            });

          if (!error) {
            console.log(`   + Added: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
            totalAdded++;
          } else {
            console.error('Error saving source:', error.message);
          }
        } else if (existing && !existing.activa) {
          // REACTIVATE EXISTING (Fixes current database state)
          const { error } = await supabase
            .from('fonts_scraping')
            .update({ 
              activa: true, 
              notes: (existing.notes || '') + `\nRe-verified active via "${query}" (${currentYear})`
            })
            .eq('id', existing.id);
          
          if (!error) {
            console.log(`   ^ Activated: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
            totalActivated++;
          } else {
            console.error('Error activating source:', error.message);
          }
        }
      }
    }
  }

  // Final summary with diagnostics
  const stats = getBraveApiStats();
  console.log('\n' + '='.repeat(50));
  console.log('DISCOVERY SUMMARY');
  console.log('='.repeat(50));
  console.log(`Brave API calls: ${stats.calls}`);
  console.log(`Brave API errors: ${stats.errors}`);
  console.log(`Total search results: ${stats.results}`);
  console.log(`Sources added: ${totalAdded}`);
  console.log(`Sources reactivated: ${totalActivated}`);
  console.log('='.repeat(50));

  if (stats.calls === 0) {
    console.error('\n⚠️ WARNING: No API calls were made!');
    console.error('   Check if BRAVE_API_KEY is properly set in GitHub secrets.');
  } else if (stats.results === 0 && stats.errors === 0) {
    console.error('\n⚠️ WARNING: API returned 0 results for all queries.');
    console.error('   This might be a rate limiting or API subscription issue.');
  } else if (totalAdded === 0 && totalActivated === 0 && stats.results > 0) {
    console.error('\n⚠️ WARNING: Found results but added nothing.');
    console.error('   All URLs might be filtered (wikipedia, facebook) or already exist.');
  }
}
