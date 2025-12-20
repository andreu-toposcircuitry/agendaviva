import { createClient } from '@supabase/supabase-js';
import { MUNICIPIS } from '@agendaviva/shared';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
 */
export async function searchWebForEvents(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ No BRAVE_API_KEY found. Skipping web discovery.');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=ES&search_lang=ca`,
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
 * This searches ALL municipalities in Vallès Oriental for children's activities
 */
export async function runDiscovery() {
  if (!supabase) {
    console.error('❌ Supabase keys missing. Cannot save discovered sources.');
    return;
  }

  // 0. Clean up old/stale scraping sources
  console.log('🧹 Cleaning up stale scraping sources...');
  
  // Delete sources not updated in 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  const { data: staleSources, error: staleError } = await supabase
    .from('fonts_scraping')
    .delete()
    .lt('updated_at', twoYearsAgo.toISOString())
    .select('id, nom');
  
  if (staleError) {
    console.error('Error deleting stale sources:', staleError.message);
  } else if (staleSources && staleSources.length > 0) {
    console.log(`✅ Deleted ${staleSources.length} sources not updated in 2 years.`);
  }

  // Delete sources where ALL activities have ended
  // First, get all scraping sources
  const { data: allSources, error: sourcesError } = await supabase
    .from('fonts_scraping')
    .select('id, url, nom');

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError.message);
  } else if (allSources) {
    const sourcesToDelete: string[] = [];
    
    for (const source of allSources) {
      // Check if this source has any ongoing or unspecified activities
      const { data: activities, error: actError } = await supabase
        .from('activitats')
        .select('data_fi')
        .eq('font_url', source.url);
      
      if (actError) {
        console.error(`Error checking activities for ${source.nom}:`, actError.message);
        continue;
      }
      
      if (activities && activities.length > 0) {
        // Check if ALL activities have ended
        const now = new Date();
        const hasOngoingOrUnspecified = activities.some(
          (act) => !act.data_fi || new Date(act.data_fi) >= now
        );
        
        if (!hasOngoingOrUnspecified) {
          // All activities have ended, mark for deletion
          sourcesToDelete.push(source.id);
        }
      }
      // If no activities found, keep the source (it might be new or just not scraped yet)
    }
    
    if (sourcesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('fonts_scraping')
        .delete()
        .in('id', sourcesToDelete);
      
      if (deleteError) {
        console.error('Error deleting sources with expired activities:', deleteError.message);
      } else {
        console.log(`✅ Deleted ${sourcesToDelete.length} sources with all activities expired.`);
      }
    }
  }
  
  console.log('');

  // 1. Use the full list of municipalities from the shared package
  const municipios = Object.values(MUNICIPIS) as Array<{ id: string; nom: string; codisPostals: string[]; poblacio: number }>;
  
  // 2. Specific keywords for children's activities
  const keywords = [
    'activitats extraescolars',
    'agenda infantil',
    'casals estiu',
    'tallers per a nens',
    'escola de música',
    'club esportiu'
  ];

  console.log(`🚀 Starting Massive Discovery for ${municipios.length} municipalities...`);
  
  let totalAdded = 0;

  for (const muni of municipios) {
    console.log(`\n📍 Checking ${muni.nom}...`);
    
    for (const keyword of keywords) {
      const query = `${keyword} ${muni.nom}`;
      
      // Be polite to the API
      await sleep(500);

      const results = await searchWebForEvents(query);
      
      for (const result of results) {
        // Skip generic domains like wikipedia, facebook login, etc.
        if (result.url.includes('wikipedia.org') || result.url.includes('facebook.com/login')) {
          continue;
        }

        const { data: existing } = await supabase
          .from('fonts_scraping')
          .select('id')
          .eq('url', result.url)
          .single();

        if (!existing) {
          // Insert as INACTIVE for review
          const { error } = await supabase
            .from('fonts_scraping')
            .insert({
              nom: `[${muni.nom}] ${result.title.substring(0, 40)}`,
              url: result.url,
              tipus: 'web',
              activa: false, // User must review to activate!
              prioritat: 5,
              notes: `Discovered searching for "${query}"\n${result.description}`
            });

          if (!error) {
            console.log(`   + Added: ${result.title.substring(0, 30)}...`);
            totalAdded++;
          } else {
            console.error('Error saving source:', error.message);
          }
        }
      }
    }
  }

  console.log(`\n✨ Discovery Finished. Added ${totalAdded} new potential sources.`);
}
