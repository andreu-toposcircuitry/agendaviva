# Implementation Summary: Scraper Robustness Fixes

This document summarizes the changes made to fix the three main issues preventing the scraper from successfully populating the database.

## Changes Made

### 1. Network Robustness (`packages/scraper/src/fetcher.ts`)

**Problem:** The fetcher was experiencing timeouts and network failures on Spanish servers.

**Solution:** Implemented a "nuclear" fetcher configuration:
- ✅ Increased timeout from 20s to 60s
- ✅ Forced IPv4 connections (`family: 4`) to fix "fetch failed" errors
- ✅ Enabled insecure SSL by default (`rejectUnauthorized: false`) to handle expired certificates
- ✅ Enhanced browser headers to better mimic Chrome
- ✅ Improved retry logic to abort on 403/404/410 errors

**Key Changes:**
```typescript
const globalAgent = new Agent({
  connect: {
    timeout: 60_000,      // 60 seconds (was 20s)
    family: 4,            // Force IPv4
    rejectUnauthorized: false, // Accept invalid SSL
  },
  headersTimeout: 60_000,
  bodyTimeout: 60_000,
});
```

### 2. Graceful Validation (`packages/agent/src/classifier.ts`)

**Problem:** The AI sometimes returns `null` or invalid types for certain fields, causing the entire classification to fail.

**Solution:** Added fallback validation logic:
- ✅ When strict validation fails, check if we have the minimum required data (activity name)
- ✅ If yes, construct a partial object with default values
- ✅ Mark as `needsReview: true` with `confianca: 0`
- ✅ Include validation errors in `reviewReasons`

**Key Changes:**
```typescript
if (!validated.success) {
  // Attempt fallback if we have minimum data
  if (raw.activitat && raw.activitat.nom) {
    return {
      success: true,
      output: {
        confianca: 0,
        needsReview: true,
        reviewReasons: ["Validation failed, saved via fallback", ...errors],
        // ... construct partial object with defaults
      }
    };
  }
  // Only fail if we don't have minimum data
  return { success: false, error: "Validation error" };
}
```

### 3. Database Permissions (`supabase/migrations/003_service_role_rls_policies.sql`)

**Problem:** Row Level Security (RLS) policies were blocking writes from the service role.

**Solution:** Created migration to add explicit policies for service role:
- ✅ Grant full access to `activitats` table for service role
- ✅ Grant full access to `fonts_scraping` table for service role
- ✅ Documented manual application steps in `supabase/DATABASE_PERMISSION_FIX.md`

**SQL:**
```sql
CREATE POLICY "Service role full access on activitats"
ON activitats FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on fonts_scraping"
ON fonts_scraping FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

## Testing

All tests pass:
- ✅ Agent package: 19/19 tests passing
- ✅ Scraper package: No tests defined (passes with `--passWithNoTests`)
- ✅ Builds successfully without errors
- ✅ TypeScript compilation succeeds

## How to Verify

### Step 1: Apply Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual via Dashboard
# See supabase/DATABASE_PERMISSION_FIX.md for instructions
```

### Step 2: Run the Scraper
```bash
pnpm --filter @agendaviva/scraper scrape
```

### Expected Results:
1. **Fewer timeout errors** - 60s timeout should allow slow servers to respond
2. **Fewer "fetch failed" errors** - IPv4 enforcement should resolve network issues
3. **No more RLS policy errors** - Database writes should succeed
4. **More activities saved** - Fallback validation should save partially valid data
5. **Activities marked for review** - Fallback items will have `needsReview: true`

## Rollback Plan

If issues arise, you can revert by:

1. **Database:** Drop the policies
```sql
DROP POLICY IF EXISTS "Service role full access on activitats" ON activitats;
DROP POLICY IF EXISTS "Service role full access on fonts_scraping" ON fonts_scraping;
```

2. **Code:** Revert to previous commit
```bash
git revert HEAD
```

## Next Steps

1. Monitor scraper logs for the three error types:
   - Network timeouts (should be reduced)
   - RLS policy violations (should be eliminated)
   - Validation failures (should use fallback instead)

2. Review activities with `needsReview: true` in the admin panel

3. Analyze which sources work best and adjust discovery accordingly

## Notes

- The insecure SSL setting is intentional for some Spanish municipal websites with expired certificates
- Fallback data is always marked for review, ensuring human oversight
- The 60s timeout may still not be enough for extremely slow servers (this is acceptable)
