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

    if (!response.ok) return [];

    const data = await response.json();
    return (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description
    }));
  } catch (e) { return []; }
}

export async function runDiscovery() {
  if (!supabase) { console.error('❌ Supabase keys missing.'); return; }

  // 1. Process ALL municipalities (Paid plan has quota for this)
  const municipios = Object.values(MUNICIPIS);
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

  console.log(`🚀 Starting Full Discovery (${municipios.length} towns)...`);

  let totalAdded = 0;
  let totalActivated = 0;

  for (const muni of municipios) {
    // Log progress without spamming
    process.stdout.write(`\r📍 Checking ${muni.nom.padEnd(20)}`);

    for (const keyword of keywords) {
      const query = `${keyword} ${muni.nom}`;
      await sleep(RATE_LIMIT_DELAY_MS);

      const results = await searchWebForEvents(query);

      for (const result of results) {
        // Strict Blocklist for junk
        if (result.url.includes('wikipedia.org') || result.url.includes('facebook.com') ||
            result.url.includes('instagram.com') || result.url.includes('archive.') ||
            result.url.includes('youtube.com')) continue;

        const { data: existing } = await supabase
          .from('fonts_scraping')
          .select('id, activa')
          .eq('url', result.url)
          .single();

        if (!existing) {
          // Insert as ACTIVE immediately
          const { error } = await supabase.from('fonts_scraping').insert({
            nom: `[${muni.nom}] ${result.title.substring(0, TITLE_LENGTH_DB)}`,
            url: result.url,
            tipus: 'web',
            activa: true,
            prioritat: 5,
            notes: `Discovered via "${query}"`
          });
          if (!error) {
            console.log(`\n   + Added: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
            totalAdded++;
          }
        } else if (existing && !existing.activa) {
          // Reactivate inactive sources
          await supabase.from('fonts_scraping').update({ activa: true }).eq('id', existing.id);
          console.log(`\n   ^ Reactivated: ${result.title.substring(0, TITLE_LENGTH_LOG)}...`);
          totalActivated++;
        }
      }
    }
  }

  console.log(`\n\n✨ Finished. Added ${totalAdded}. Activated ${totalActivated}.`);
}
