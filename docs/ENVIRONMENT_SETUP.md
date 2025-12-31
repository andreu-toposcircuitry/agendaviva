# Environment Setup Guide

This guide explains how to properly configure environment variables for the Agenda Viva admin application.

## Required Environment Variables

The admin application requires Supabase credentials to function. These must be configured before running the application.

### Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to Settings → API
   - Copy the following values:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` public key (starts with `eyJ...`)

3. **Update `.env` file:**
   ```bash
   # Replace these with your actual Supabase values
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Verify the configuration:**
   ```bash
   # Start the dev server
   pnpm --filter @agendaviva/admin dev
   
   # In another terminal, check the health endpoint
   curl http://localhost:5173/api/health
   ```

   You should see a JSON response with `status: "ok"` and the environment variables marked as configured.

### Production/Preview Deployments

#### Cloudflare Pages

1. Go to your Cloudflare Pages project
2. Settings → Environment Variables
3. Add the following variables:
   - `PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

#### Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add the same variables as above
4. Make sure to add them for all environments (Production, Preview, Development)

#### Netlify

1. Go to your Netlify site
2. Site settings → Environment variables
3. Add the same variables as above

## Database Setup

After configuring environment variables, ensure your database is set up correctly:

1. **Apply migrations:**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Create your first admin user:**
   - Sign up through the admin UI
   - Get your user ID from Supabase Dashboard (Authentication → Users)
   - Run this SQL in Supabase SQL Editor:
     ```sql
     INSERT INTO public.admin_users (user_id, email, role, is_active)
     VALUES (
       'your-user-uuid-here',
       'your-email@example.com',
       'admin',
       true
     );
     ```

3. **Verify access:**
   - Log in to the admin UI
   - Go to `/activitats`
   - You should see the activities list load successfully

## Troubleshooting

### "Failed to fetch activities" error

**Check 1: Environment Variables**
```bash
# Visit the health check endpoint
curl http://localhost:5173/api/health
```

If you see `PUBLIC_SUPABASE_URL: false` or `PUBLIC_SUPABASE_ANON_KEY: false`, your environment variables are not configured.

**Check 2: Authentication**

If the health check shows you're not authenticated, try:
1. Log out and log back in
2. Clear browser cookies and cache
3. Check browser console for authentication errors

**Check 3: Admin Permissions**

If authentication works but you get a 403 error:
1. Verify you added your user to the `admin_users` table
2. Check that `is_active` is `true`
3. Verify RLS policies are applied (run migration 007)

**Check 4: Database Connection**

If you get a 500 error:
1. Check Supabase project is running (not paused)
2. Verify migrations are applied
3. Check server logs for database errors

### Environment variables not loading in production

**Cloudflare Pages:**
- Environment variables must be set in the Cloudflare dashboard
- Rebuild the application after setting variables
- Check build logs for environment variable warnings

**Vercel:**
- Ensure variables are set for the correct environment
- Redeploy after setting variables
- Check deployment logs

**Netlify:**
- Variables must be set in site settings
- Trigger a new deploy after setting variables

### SvelteKit not seeing PUBLIC_ prefixed variables

Make sure you're using the `PUBLIC_` prefix for any variables that need to be accessible in the browser:
- ✅ `PUBLIC_SUPABASE_URL`
- ✅ `PUBLIC_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_URL` (won't be available in browser)

## Security Notes

- ✅ **Safe to commit:** `.env.example` (template without real values)
- ❌ **Never commit:** `.env` (contains real credentials)
- ✅ **Safe for client-side:** `PUBLIC_SUPABASE_ANON_KEY` (protected by RLS policies)
- ❌ **Never use client-side:** `SUPABASE_SERVICE_KEY` (bypasses RLS)

## Additional Resources

- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-public)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Full production deployment guide
