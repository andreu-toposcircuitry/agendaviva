import { createClient } from '@supabase/supabase-js';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase (if keys are present)
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) 
  : null;

// Constants
const MAX_TITLE_LENGTH = 50;

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

/**
 * Search the web for events using Brave Search API
 */
export async function searchWebForEvents(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ No BRAVE_API_KEY found. Skipping web discovery.');
    return [];
  }

  console.log(`🔍 Searching the web for: "${query}"...`);

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&country=ES&search_lang=ca`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`Brave Search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results || [];

    return results.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (error) {
    console.error('Error during Brave search:', error);
    return [];
  }
}

/**
 * Run a discovery cycle and SAVE to Supabase
 */
export async function runDiscovery() {
  if (!supabase) {
    console.error('❌ Supabase keys missing. Cannot save discovered sources.');
    return;
  }

  const municipalities = ['Granollers', 'Cardedeu', 'Mollet del Vallès', 'La Garriga'];
  const keywords = ['agenda cultural', 'concerts avui', 'activitats familiars'];

  let newSourcesCount = 0;

  for (const city of municipalities) {
    for (const keyword of keywords) {
      const query = `${keyword} ${city}`;
      const results = await searchWebForEvents(query);
      
      for (const result of results) {
        // Check if we already have this URL (to avoid duplicates)
        const { data: existing } = await supabase
          .from('fonts_scraping')
          .select('id')
          .eq('url', result.url)
          .single();

        if (!existing) {
          // Insert as INACTIVE so a human can review it first
          const { error } = await supabase
            .from('fonts_scraping')
            .insert({
              nom: `[DISCOVERED] ${result.title.substring(0, MAX_TITLE_LENGTH)}`,
              url: result.url,
              tipus: 'web',
              activa: false, // <--- Human review required!
              notes: `Found via Brave searching for "${query}"\n${result.description}`,
              prioritat: 1
            });

          if (!error) {
            console.log(`✅ Saved new source: ${result.title}`);
            newSourcesCount++;
          } else {
            console.error('Error saving source:', error.message);
          }
        }
      }
    }
  }

  console.log(`\n✨ Discovery complete. Added ${newSourcesCount} new candidate sources.`);
}
