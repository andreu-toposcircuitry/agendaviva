import { createClient } from '@supabase/supabase-js';
import { MUNICIPIS } from '@agendaviva/shared';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Configuration constants
const STALE_SOURCE_THRESHOLD_YEARS = 2; // Delete sources not updated in this many years
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
export async function searchWebForEvents(query: string): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ No BRAVE_API_KEY found. Skipping web discovery.');
    return [];
  }

  try {
    // FRESHNESS FILTER: &freshness=py (Past Year)
    // This ensures we only get pages updated in the last 12 months.
    // Pages "not actualized in 2 years" will be completely ignored.
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
  
  // Delete sources not updated in STALE_SOURCE_THRESHOLD_YEARS
  const thresholdDate = new Date();
  thresholdDate.setFullYear(thresholdDate.getFullYear() - STALE_SOURCE_THRESHOLD_YEARS);
  
  const { data: staleSources, error: staleError } = await supabase
    .from('fonts_scraping')
    .delete()
    .lt('updated_at', thresholdDate.toISOString())
    .select('id, nom');
  
  if (staleError) {
    console.error('Error deleting stale sources:', staleError.message);
  } else if (staleSources && staleSources.length > 0) {
    console.log(`✅ Deleted ${staleSources.length} sources not updated in ${STALE_SOURCE_THRESHOLD_YEARS} years.`);
  }

  // Delete sources where ALL activities have ended
  // Fetch all sources and their activities in optimized queries
  const { data: allSources, error: sourcesError } = await supabase
    .from('fonts_scraping')
    .select('id, url, nom');

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError.message);
  } else if (allSources && allSources.length > 0) {
    // Fetch all activities with their font_url and data_fi in a single query
    const { data: allActivities, error: actError } = await supabase
      .from('activitats')
      .select('font_url, data_fi')
      .in('font_url', allSources.map(s => s.url));
    
    if (actError) {
      console.error('Error fetching activities:', actError.message);
    } else {
      // Group activities by font_url
      const activitiesBySource = new Map<string, Array<{ data_fi: string | null }>>();
      if (allActivities) {
        for (const activity of allActivities) {
          if (!activitiesBySource.has(activity.font_url)) {
            activitiesBySource.set(activity.font_url, []);
          }
          activitiesBySource.get(activity.font_url)!.push({ data_fi: activity.data_fi });
        }
      }
      
      const sourcesToDelete: string[] = [];
      const now = new Date();
      
      for (const source of allSources) {
        const activities = activitiesBySource.get(source.url);
        
        if (activities && activities.length > 0) {
          // Check if ALL activities have ended
          // Note: Using >= because we compare dates at midnight UTC. An activity with
          // data_fi of "2025-01-20" is considered ongoing on "2025-01-20" throughout the day.
          // Only activities with data_fi < today are considered fully expired.
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
  }
  
  console.log('');

  // 1. Use the full list of municipalities from the shared package
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

  console.log(`\n✨ Discovery Finished. Added ${totalAdded} new sources. Activated ${totalActivated} existing sources.`);
}
