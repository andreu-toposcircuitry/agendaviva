-- ============================================
-- AGENDA VIVA VO - Fix Search RPC
-- ============================================
-- Migration: 002_fix_search_rpc
-- Description: Update search function to return full activity data
-- ============================================

-- Drop and recreate search function to return full activity data
CREATE OR REPLACE FUNCTION search_activitats(
  search_query TEXT,
  filter_municipi TEXT DEFAULT NULL,
  filter_tipologia TEXT DEFAULT NULL,
  filter_nd_min INTEGER DEFAULT NULL,
  filter_edat INTEGER DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS SETOF activitats_public AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM activitats_public ap
  JOIN activitats a ON ap.id = a.id
  WHERE
    (search_query IS NULL OR search_query = '' OR a.search_vector @@ websearch_to_tsquery('spanish', search_query))
    AND (filter_municipi IS NULL OR ap.municipi_id = filter_municipi)
    AND (filter_tipologia IS NULL OR ap.tipologia_principal = filter_tipologia)
    AND (filter_nd_min IS NULL OR ap.nd_score >= filter_nd_min)
    AND (filter_edat IS NULL OR (
      (ap.edat_min IS NULL OR ap.edat_min <= filter_edat) AND
      (ap.edat_max IS NULL OR ap.edat_max >= filter_edat)
    ))
  ORDER BY
    ts_rank(a.search_vector, websearch_to_tsquery('spanish', COALESCE(search_query, ''))) DESC,
    ap.destacada DESC,
    ap.updated_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION search_activitats TO anon, authenticated;
