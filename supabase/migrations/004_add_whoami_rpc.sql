-- Migration: Add whoami RPC function
-- This function returns the current authenticated role and session user
-- Used for diagnosing authentication issues in CI/CD workflows

CREATE OR REPLACE FUNCTION whoami()
RETURNS TABLE (
  curr_user text,
  sess_user text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    current_user::text AS curr_user,
    session_user::text AS sess_user;
END;
$$;

-- Grant execute permission to all roles (anon, authenticated, service_role)
GRANT EXECUTE ON FUNCTION whoami() TO anon, authenticated, service_role;
