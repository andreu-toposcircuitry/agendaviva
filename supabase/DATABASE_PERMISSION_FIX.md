# Database Permission Fix - Manual Instructions

## Problem
The scraper was failing with the error:
```
Save failed: new row violates row-level security policy for table "activitats"
```

This occurred because the service role (used by the scraper) didn't have permission to write to the database due to Row Level Security (RLS) policies.

## Solution

You can apply the fix in two ways:

### Option 1: Run the Migration File (Recommended)
If you're using Supabase CLI locally:
```bash
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
If you prefer to apply the fix manually through the dashboard:

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL:

```sql
-- Allow the service role (used by the scraper) to insert/update anything
CREATE POLICY "Service role full access on activitats"
ON activitats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on fonts_scraping"
ON fonts_scraping
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled but doesn't block the backend
ALTER TABLE activitats ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonts_scraping ENABLE ROW LEVEL SECURITY;
```

4. Click **Run** to execute the query
5. Verify the policies were created by going to **Authentication** → **Policies**

## What This Does

- Creates explicit RLS policies that grant full access to the service role
- Ensures the scraper (which uses `SUPABASE_SERVICE_KEY`) can write to both `activitats` and `fonts_scraping` tables
- Maintains RLS security for other users while allowing backend operations to work

## Verification

After applying these changes, run the scraper again:
```bash
pnpm --filter @agendaviva/scraper scrape
```

You should no longer see "row-level security policy" errors in the logs.
