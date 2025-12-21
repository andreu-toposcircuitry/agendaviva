import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

// Create the client - placeholder key is used during build when env vars are not set
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Flag to check if we have a real Supabase connection
const hasValidConnection = !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY && import.meta.env.PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key-for-build';

export interface ActivitatPublic {
  id: string;
  nom: string;
  slug: string;
  descripcio?: string;
  tipologia_principal: string;
  subtipologia?: string;
  tipologies: Array<{ codi: string; score: number; principal?: boolean }>;
  quan_es_fa: string;
  edat_min?: number;
  edat_max?: number;
  edat_text?: string;
  municipi_id?: string;
  municipi_nom?: string;
  barri_zona?: string;
  espai?: string;
  adreca?: string;
  es_online: boolean;
  dies?: string;
  horari?: string;
  preu?: string;
  tags: string[];
  nd_score?: number;
  nd_nivell?: string;
  nd_justificacio?: string;
  nd_indicadors_positius?: string[];
  nd_indicadors_negatius?: string[];
  nd_recomanacions?: string[];
  nd_verificat_per?: string;
  destacada: boolean;
  last_verified?: string;
  updated_at: string;
  entitat_nom?: string;
  entitat_slug?: string;
  entitat_verificada?: boolean;
  contacte_email?: string;
  contacte_telefon?: string;
  contacte_web?: string;
  link_inscripcio?: string;
}

export interface Municipi {
  id: string;
  nom: string;
  nom_oficial?: string;
  comarca: string;
  codis_postals: string[];
  poblacio?: number;
}

export interface GetActivitatsParams {
  municipi?: string;
  tipologia?: string;
  ndMin?: number;
  edat?: number;
  limit?: number;
  offset?: number;
  q?: string;
}

export async function getActivitats(params: GetActivitatsParams = {}) {
  // If there's a search query, use the RPC function
  if (params.q && params.q.trim()) {
    return searchActivitats(
      params.q,
      {
        municipi: params.municipi,
        tipologia: params.tipologia,
        ndMin: params.ndMin,
        edat: params.edat,
      },
      params.limit || 20,
      params.offset || 0
    );
  }

  // Otherwise use direct query (existing logic)
  let query = supabase
    .from('activitats_public')
    .select('*', { count: 'exact' });

  if (params.municipi) {
    query = query.eq('municipi_id', params.municipi);
  }
  if (params.tipologia) {
    query = query.eq('tipologia_principal', params.tipologia);
  }
  if (params.ndMin) {
    query = query.gte('nd_score', params.ndMin);
  }
  if (params.edat) {
    query = query.or(`edat_min.lte.${params.edat},edat_min.is.null`);
    query = query.or(`edat_max.gte.${params.edat},edat_max.is.null`);
  }

  const limit = params.limit || 20;
  const offset = params.offset || 0;

  query = query
    .order('destacada', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  return { data: data as ActivitatPublic[] | null, error, count };
}

export async function getActivitat(slug: string) {
  const { data, error } = await supabase
    .from('activitats_public')
    .select('*')
    .eq('slug', slug)
    .single();

  return { data: data as ActivitatPublic | null, error };
}

export async function getActivitatsByTipologia(tipologia: string, limit = 20) {
  const { data, error, count } = await supabase
    .from('activitats_public')
    .select('*', { count: 'exact' })
    .eq('tipologia_principal', tipologia)
    .order('destacada', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  return { data: data as ActivitatPublic[] | null, error, count };
}

export async function getActivitatsByMunicipi(municipiId: string, limit = 20) {
  const { data, error, count } = await supabase
    .from('activitats_public')
    .select('*', { count: 'exact' })
    .eq('municipi_id', municipiId)
    .order('destacada', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  return { data: data as ActivitatPublic[] | null, error, count };
}

export async function getNDFriendlyActivitats(limit = 20) {
  const { data, error, count } = await supabase
    .from('activitats_public')
    .select('*', { count: 'exact' })
    .gte('nd_score', 4)
    .order('nd_score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  return { data: data as ActivitatPublic[] | null, error, count };
}

export async function getMunicipis() {
  const { data, error } = await supabase
    .from('municipis')
    .select('*')
    .order('nom');

  return { data: data as Municipi[] | null, error };
}

export async function searchActivitats(
  searchQuery: string,
  filters: {
    municipi?: string;
    tipologia?: string;
    ndMin?: number;
    edat?: number;
  } = {},
  limit = 20,
  offset = 0
): Promise<{ data: ActivitatPublic[] | null; error: any; count: number | null }> {
  const { data, error } = await supabase.rpc('search_activitats', {
    search_query: searchQuery || null,
    filter_municipi: filters.municipi || null,
    filter_tipologia: filters.tipologia || null,
    filter_nd_min: filters.ndMin || null,
    filter_edat: filters.edat || null,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    return { data: null, error, count: null };
  }

  return {
    data: data as ActivitatPublic[] | null,
    error: null,
    count: data?.length ?? null
  };
}
