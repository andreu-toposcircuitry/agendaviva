import { createClient } from '@supabase/supabase-js';
import { MUNICIPIS } from '@agendaviva/shared';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// PAID PLAN SETTINGS
// Base Plan allows 20 queries/second. We stay safe at ~1.5 queries/second.
const RATE_LIMIT_DELAY_MS = 600;
const TITLE_LENGTH_DB = 50;
const TITLE_LENGTH_LOG = 40;

// Debug mode: Set DISCOVERY_DEBUG_LIMIT=N in CI to process only N municipalities.
// This produces concise logs for debugging. Example: DISCOVERY_DEBUG_LIMIT=1
const DEBUG_LIMIT = process.env.DISCOVERY_DEBUG_LIMIT
  ? parseInt(process.env.DISCOVERY_DEBUG_LIMIT, 10)
  : undefined;

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface SearchResult { title: string; url: string; description: string; }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchWebForEvents(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) { console.warn('⚠️ No BRAVE_API_KEY'); return []; }

  try {
    // &freshness=py (Past Year) ensures we don't scrape old PDF agendas from 2019
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&country=ES&search_lang=ca&freshness=py`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_API_KEY } }
    );

    if (response.status === 429) {
      console.error('⚠️ Brave API Rate Limit hit. (Check your plan quota)');
      return [];
    }

    if (!response.ok) {
      console.error(`⚠️ Brave API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description
    }));
  } catch (e) {
    console.error('⚠️ Brave API fetch error:', e instanceof Error ? e.message : e);
    return [];
  }
}

export async function runDiscovery() {
  // Log environment variable presence (never log actual values)
  console.log('Discovery env: BRAVE_API_KEY present:', !!BRAVE_API_KEY);
  console.log('Discovery env: SUPABASE_URL present:', !!SUPABASE_URL);
  console.log('Discovery env: SUPABASE_SERVICE_KEY present:', !!SUPABASE_SERVICE_KEY);

  if (!supabase) { console.error('❌ Supabase keys missing.'); return; }

  if (DEBUG_LIMIT) {
    console.log(`Discovery debug mode: limiting to ${DEBUG_LIMIT} municipalities`);
  }

  // 1. Process municipalities (limited in debug mode)
  let municipios = Object.values(MUNICIPIS);
  if (DEBUG_LIMIT && DEBUG_LIMIT > 0) {
    municipios = municipios.slice(0, DEBUG_LIMIT);
  }
  const currentYear = new Date().getFullYear();

  const keywords = [
    `activitats extraescolars ${currentYear}`,
    `agenda infantil ${currentYear}`,
    `casals estiu ${currentYear}`,
    `tallers per a nens ${currentYear}`,
    `escola de música ${currentYear}`,
    `club esportiu ${currentYear}`,
    `agenda cultural ${currentYear}`
  ];

  console.log(`🚀 Starting Discovery (${municipios.length} towns, ${keywords.length} keywords)...`);

  let totalAdded = 0;
  let totalActivated = 0;

  for (const muni of municipios) {
    // Log progress without spamming
    process.stdout.write(`\r📍 Checking ${muni.nom.padEnd(20)}`);

    for (const keyword of keywords) {
      const query = `${keyword} ${muni.nom}`;
      await sleep(RATE_LIMIT_DELAY_MS);

      const results = await searchWebForEvents(query);

      // Log query results summary
      const n = Array.isArray(results) ? results.length : 0;
      console.log(`\n   Query "${query}": ${n} results`);
      if (n > 0) {
        console.log('   Sample results:', JSON.stringify(
          results.slice(0, 3).map(r => ({ title: r.title, url: r.url, description: r.description }))
        ));
      }

      for (const result of results) {
        try {
          // Strict Blocklist for junk
          if (result.url.includes('wikipedia.org') || result.url.includes('facebook.com') ||
              result.url.includes('instagram.com') || result.url.includes('archive.') ||
              result.url.includes('youtube.com')) continue;

          const { data: existing, error: existingErr } = await supabase
            .from('fonts_scraping')
            .select('id, activa')
            .eq('url', result.url)
            .single();

          // Handle Supabase select error (PGRST116 = no rows found is expected, not an error)
          if (existingErr && existingErr.code !== 'PGRST116') {
            console.error('Supabase error when checking existing url', { url: result.url, existingErr });
            continue;
          }

          if (!existing) {
            // Insert as ACTIVE immediately
            const { error: insertErr } = await supabase.from('fonts_scraping').insert({
              nom: `[${muni.nom}] ${result.title.substring(0, TITLE_LENGTH_DB)}`,
              url: result.url,
              tipus: 'web',
              activa: true,
              prioritat: 5,
              notes: `Discovered via "${query}"`
            });
            if (insertErr) {
              console.error('Supabase insert error', { url: result.url, insertErr });
            } else {
              console.log(`   + Added: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
              totalAdded++;
            }
          } else if (existing && !existing.activa) {
            // Reactivate inactive sources
            const { error: updateErr } = await supabase.from('fonts_scraping').update({ activa: true }).eq('id', existing.id);
            if (updateErr) {
              console.error('Supabase update error', { id: existing.id, url: result.url, updateErr });
            } else {
              console.log(`   ^ Reactivated: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
              totalActivated++;
            }
          }
        } catch (err) {
          console.error('Unexpected error processing result', {
            url: result.url,
            err: err instanceof Error ? err.message : err
          });
        }
      }
    }
  }

  console.log(`\n\n✨ Finished. Added ${totalAdded}. Activated ${totalActivated}.`);

  // Fetch and print a sample of the most recent rows for verification
  console.log('\n📋 Fetching sample of recent fonts_scraping rows...');
  try {
    const { data: sampleRows, error: sampleErr } = await supabase
      .from('fonts_scraping')
      .select('id, nom, url, activa, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (sampleErr) {
      console.error('Sample fetch error:', sampleErr);
    } else if (sampleRows && sampleRows.length > 0) {
      console.log(`Recent rows (${sampleRows.length}):`);
      console.log(JSON.stringify(sampleRows, null, 2));
    } else {
      console.log('No rows found in fonts_scraping table.');
    }
  } catch (err) {
    console.error('Unexpected error fetching sample rows:', err instanceof Error ? err.message : err);
  }
}
