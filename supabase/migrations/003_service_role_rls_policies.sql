-- Migration: Service Role RLS Policies
-- This migration fixes the database permission errors by adding policies
-- that allow the service role (used by the scraper) to bypass RLS checks.
--
-- Background: The scraper uses the service role key to write data, but
-- Row Level Security (RLS) policies were blocking writes with the error:
-- "new row violates row-level security policy for table 'activitats'"
--
-- This migration creates explicit policies that grant full access to the
-- service role, allowing the scraper to insert and update data successfully.

-- Allow the service role (used by the scraper) to insert/update anything on activitats
CREATE POLICY "Service role full access on activitats"
ON activitats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow the service role (used by the scraper) to insert/update anything on fonts_scraping
CREATE POLICY "Service role full access on fonts_scraping"
ON fonts_scraping
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled but doesn't block the backend
ALTER TABLE activitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonts_scraping ENABLE ROW LEVEL SECURITY;
