import { json, error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

interface ActivitatListItem {
  id: string;
  nom: string;
  municipi_id: string | null;
  municipi_nom: string | null;
  tipologia_principal: string;
  estat: string;
  confianca_global: number | null;
  nd_nivell: string | null;
  nd_score: number | null;
  needs_review: boolean;
  created_at: string;
  updated_at: string;
}

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      console.error('Authentication failed: No user in locals');
      throw error(401, {
        message: 'Authentication required. Please sign in.'
      });
    }

    // Check if user is admin/moderator
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      console.error('Error checking admin status:', adminError);
      throw error(403, {
        message: 'Failed to verify admin permissions. Check database configuration and RLS policies.'
      });
    }

    if (!adminUser || !adminUser.is_active) {
      console.error('User not authorized:', user.id);
      throw error(403, {
        message: 'Admin or Moderator role required. Your account needs to be added to the admin_users table.'
      });
    }

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100);
    const sortBy = url.searchParams.get('sortBy') || 'updated_at';
    const order = url.searchParams.get('order') || 'desc';
    const search = url.searchParams.get('q') || null;
    const municipiId = url.searchParams.get('municipi_id') || null;
    const tipologia = url.searchParams.get('tipologia_principal') || null;
    const estat = url.searchParams.get('estat') || null;
    const needsReview = url.searchParams.get('needs_review') || null;
    const confiancaMin = url.searchParams.get('confianca_min') ? parseInt(url.searchParams.get('confianca_min')!) : null;
    const confiancaMax = url.searchParams.get('confianca_max') ? parseInt(url.searchParams.get('confianca_max')!) : null;
    const ndScoreMin = url.searchParams.get('nd_score_min') ? parseInt(url.searchParams.get('nd_score_min')!) : null;
    const ndScoreMax = url.searchParams.get('nd_score_max') ? parseInt(url.searchParams.get('nd_score_max')!) : null;

    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from('activitats')
      .select(
        `
        id,
        nom,
        municipi_id,
        tipologia_principal,
        estat,
        confianca_global,
        nd_nivell,
        nd_score,
        needs_review,
        created_at,
        updated_at,
        municipis!inner(nom)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'plain',
        config: 'simple'
      });
    }

    if (municipiId) {
      query = query.eq('municipi_id', municipiId);
    }

    if (tipologia) {
      query = query.eq('tipologia_principal', tipologia);
    }

    if (estat) {
      query = query.eq('estat', estat);
    }

    if (needsReview !== null) {
      query = query.eq('needs_review', needsReview === 'true');
    }

    if (confiancaMin !== null) {
      query = query.gte('confianca_global', confiancaMin);
    }

    if (confiancaMax !== null) {
      query = query.lte('confianca_global', confiancaMax);
    }

    if (ndScoreMin !== null) {
      query = query.gte('nd_score', ndScoreMin);
    }

    if (ndScoreMax !== null) {
      query = query.lte('nd_score', ndScoreMax);
    }

    // Apply sorting
    const validSortColumns = ['nom', 'updated_at', 'created_at', 'confianca_global', 'nd_score', 'estat'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'updated_at';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching activities:', queryError);
      throw error(500, {
        message: `Database query failed: ${queryError.message}. Check database connection and table structure.`
      });
    }

    // Transform data to include municipi_nom
    const activities: ActivitatListItem[] = (data || []).map((item: any) => ({
      id: item.id,
      nom: item.nom,
      municipi_id: item.municipi_id,
      municipi_nom: item.municipis?.nom || null,
      tipologia_principal: item.tipologia_principal,
      estat: item.estat,
      confianca_global: item.confianca_global,
      nd_nivell: item.nd_nivell,
      nd_score: item.nd_score,
      needs_review: item.needs_review,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return json({
      activities,
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    console.error('Unexpected error in activities list:', err);
    throw error(500, {
      message: `Internal server error: ${err.message || 'Unknown error'}`
    });
  }
};
