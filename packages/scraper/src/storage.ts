import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateSlug, generateUniqueSlug, type AgentOutput } from '@agendaviva/shared';

let supabase: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }

    supabase = createClient(url, key);
  }

  return supabase;
}

/**
 * Reset the Supabase client (for testing)
 */
export function resetSupabaseClient(): void {
  supabase = null;
}

export interface SaveActivityResult {
  success: boolean;
  activitatId?: string;
  cuaId?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Save activity from agent classification to database
 */
export async function saveActivityFromAgent(
  agentOutput: AgentOutput,
  sourceUrl: string,
  sourceText: string
): Promise<SaveActivityResult> {
  const sb = getSupabaseClient();
  const { activitat, nd, needsReview, reviewReasons, confianca, modelUsed } = agentOutput;

  try {
    // 1. Check for potential duplicates by name similarity
    const { data: existing } = await sb
      .from('activitats')
      .select('id, nom, slug')
      .ilike('nom', `%${activitat.nom.slice(0, 50)}%`)
      .limit(5);

    if (existing && existing.length > 0) {
      // Simple duplicate check - could be enhanced with fuzzy matching
      const normalizedName = activitat.nom.toLowerCase().replace(/\s+/g, ' ').trim();
      const isDup = existing.some(
        (e) => e.nom.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedName
      );
      if (isDup) {
        return {
          success: false,
          isDuplicate: true,
          error: `Potential duplicate of existing activity: ${existing[0].nom}`,
        };
      }
    }

    // 2. Get existing slugs to generate unique one
    const { data: existingSlugs } = await sb
      .from('activitats')
      .select('slug');

    const slugList = (existingSlugs || []).map((r) => r.slug);
    const slug = generateUniqueSlug(activitat.nom, slugList);

    // 3. Find or create entity if present
    let entitatId: string | null = null;
    // Note: Agent output doesn't include entitat in current schema
    // This can be extended when entitat extraction is added

    // 4. Insert activity
    const { data: newActivitat, error: actError } = await sb
      .from('activitats')
      .insert({
        nom: activitat.nom,
        slug,
        descripcio: activitat.descripcio,
        entitat_id: entitatId,
        tipologies: activitat.tipologies.map((t) => ({
          codi: t.codi,
          score: t.score,
          justificacio: t.justificacio,
        })),
        tipologia_principal: activitat.tipologies[0]?.codi,
        quan_es_fa: activitat.quanEsFa || 'puntual', // Fallback if null
        edat_min: activitat.edatMin,
        edat_max: activitat.edatMax,
        edat_text: activitat.edatText,
        municipi_id: activitat.municipiId,
        barri_zona: activitat.barriZona,
        espai: activitat.espai,
        adreca: activitat.adreca,
        es_online: false,
        dies: activitat.dies,
        horari: activitat.horari,
        preu: activitat.preu,
        email: activitat.email,
        telefon: activitat.telefon,
        web: activitat.web,
        tags: activitat.tags || [],
        // ND fields with fallbacks
        nd_score: nd?.score || 1,
        nd_nivell: nd?.nivell,
        nd_justificacio: nd?.justificacio,
        nd_indicadors_positius: nd?.indicadorsPositius || [],
        nd_indicadors_negatius: nd?.indicadorsNegatius || [],
        nd_recomanacions: nd?.recomanacions || [],
        nd_confianca: nd?.confianca || 0,
        nd_verificat_per: 'inferit',
        // Status
        estat: needsReview ? 'pendent' : 'publicada',
        // Source tracking
        font_url: sourceUrl,
        font_text: sourceText.slice(0, 5000),
        font_tipus: 'scraping',
        // Agent metadata
        confianca_global: confianca,
        agent_model: modelUsed,
        agent_processed_at: new Date().toISOString(),
        created_by: 'agent',
      })
      .select('id')
      .single();

    if (actError) throw actError;

    // 5. Add to review queue if needed
    let cuaId: string | undefined;
    if (needsReview && newActivitat) {
      const { data: cuaItem } = await sb
        .from('cua_revisio')
        .insert({
          activitat_id: newActivitat.id,
          prioritat: confianca < 50 ? 'alta' : 'mitjana',
          motiu: reviewReasons.join('; '),
          motiu_detall: { reasons: reviewReasons },
          temps_estimat_minuts: 3,
        })
        .select('id')
        .single();

      cuaId = cuaItem?.id;
    }

    return {
      success: true,
      activitatId: newActivitat?.id,
      cuaId,
    };
  } catch (error: any) {
    // FIX: Properly handle Supabase error objects
    const msg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
    return {
      success: false,
      error: msg,
    };
  }
}

export interface ScrapingSourceRecord {
  id: string;
  nom: string;
  url: string;
  tipus: string;
  activa: boolean;
  prioritat?: number;
  config?: Record<string, unknown>;
}

/**
 * Get all active scraping sources
 */
export async function getActiveSources(): Promise<ScrapingSourceRecord[]> {
  const sb = getSupabaseClient();

  // First, get total count for diagnostics
  const { count: totalCount } = await sb
    .from('fonts_scraping')
    .select('*', { count: 'exact', head: true });

  const { count: activeCount } = await sb
    .from('fonts_scraping')
    .select('*', { count: 'exact', head: true })
    .eq('activa', true);

  console.log(`\n📊 Database Status:`);
  console.log(`   Total sources in fonts_scraping: ${totalCount ?? 'unknown'}`);
  console.log(`   Active sources (activa=true): ${activeCount ?? 'unknown'}`);

  if (totalCount === 0) {
    console.log(`   ⚠️ Table is empty! Run discovery first: pnpm discover`);
  } else if (activeCount === 0) {
    console.log(`   ⚠️ No active sources! All ${totalCount} sources have activa=false`);
  }

  const { data, error } = await sb
    .from('fonts_scraping')
    .select('*')
    .eq('activa', true)
    .order('prioritat', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update scraping source with results
 */
export async function updateScrapingSource(
  sourceId: string,
  result: { success: boolean; itemsFound: number; error?: string }
): Promise<void> {
  const sb = getSupabaseClient();

  const updates: Record<string, unknown> = {
    last_scraped: new Date().toISOString(),
    last_items_found: result.itemsFound,
  };

  if (result.success) {
    updates.last_success = new Date().toISOString();
    updates.last_error = null;
  } else {
    updates.last_error = result.error;
  }

  await sb
    .from('fonts_scraping')
    .update(updates)
    .eq('id', sourceId);

  // Increment total items found
  if (result.itemsFound > 0) {
    await sb.rpc('increment_scraping_items', {
      source_id: sourceId,
      amount: result.itemsFound,
    });
  }
}

/**
 * Log scraping run for monitoring
 */
export async function logScrapingRun(
  sourceId: string,
  result: {
    blocksFound: number;
    activitiesCreated: number;
    activitiesQueued: number;
    errors: string[];
    durationMs: number;
  }
): Promise<void> {
  const sb = getSupabaseClient();

  try {
    await sb
      .from('scraping_logs')
      .insert({
        source_id: sourceId,
        blocks_found: result.blocksFound,
        activities_created: result.activitiesCreated,
        activities_queued: result.activitiesQueued,
        errors: result.errors,
        duration_ms: result.durationMs,
        created_at: new Date().toISOString(),
      });
  } catch {
    // Ignore logging errors if table missing or other issues
  }
}
