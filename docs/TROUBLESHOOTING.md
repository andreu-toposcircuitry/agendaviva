# Troubleshooting Guide: "Failed to Fetch Activities" Error

This guide helps you diagnose and fix the "failed to fetch activities" error in the admin activities management page.

## Quick Diagnosis

Visit the health check endpoint to quickly diagnose issues:

**Local:** `http://localhost:5173/api/health`  
**Production:** `https://your-domain.com/api/health`

The response will show:
- ✅ Environment variables status
- ✅ Authentication status
- ✅ API endpoint accessibility

## Common Issues and Solutions

### 1. Environment Variables Not Configured

**Symptoms:**
- Health check shows `PUBLIC_SUPABASE_URL: false`
- Error: "Error de xarxa: No es pot connectar amb el servidor"

**Solution (Local Development):**
```bash
# 1. Copy example file
cp .env.example .env

# 2. Get your Supabase credentials from https://app.supabase.com
# Go to: Project Settings → API

# 3. Edit .env and set:
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 4. Restart dev server
pnpm --filter @agendaviva/admin dev
```

**Solution (Cloudflare Pages):**
1. Go to Cloudflare Dashboard → Pages → Your Project
2. Settings → Environment Variables
3. Add:
   - `PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = `eyJ...`
4. Redeploy the application

**Solution (Vercel):**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add the same variables as above
4. Important: Add for all environments (Production, Preview, Development)
5. Redeploy

**Solution (Netlify):**
1. Go to Netlify Dashboard → Your Site
2. Site settings → Environment variables
3. Add the same variables
4. Trigger a new deploy

### 2. Authentication Not Working

**Symptoms:**
- Error: "No autenticat. Si us plau, torna a iniciar sessió." (401)
- Health check shows `authentication: { status: "not_authenticated" }`

**Solution:**
```bash
# 1. Clear browser cache and cookies
# 2. Log out and log back in
# 3. Check browser console for errors

# If using incognito/private mode, cookies might be blocked:
# - Try in normal browser window
# - Check browser cookie settings
```

**For developers:** If you just deployed, cookies might not be syncing:
1. The auth store now syncs tokens to cookies automatically
2. After login, the page should reload to sync server state
3. If issues persist, check `apps/admin/src/lib/stores/auth.ts`

### 3. No Admin Permissions

**Symptoms:**
- Error: "No tens permisos per accedir a aquesta pàgina." (403)
- You can log in but can't see activities

**Solution:**
```sql
-- 1. Get your user ID from Supabase Dashboard
-- Go to: Authentication → Users → Copy your UUID

-- 2. Run this SQL in Supabase SQL Editor:
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES (
  'your-user-uuid-here',  -- Replace with your UUID
  'your-email@example.com',  -- Your email
  'admin',  -- Or 'moderator'
  true
);

-- 3. Verify it worked:
SELECT * FROM admin_users WHERE email = 'your-email@example.com';
```

### 4. Database Not Set Up

**Symptoms:**
- Error: "Database query failed" (500)
- Error mentions missing tables or RLS policies

**Solution:**
```bash
# 1. Apply all migrations
cd supabase
supabase db push

# 2. Verify migrations applied
supabase db diff

# 3. Check tables exist
# In Supabase Dashboard → SQL Editor, run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activitats', 'admin_users', 'municipis');
```

### 5. RLS Policies Not Applied

**Symptoms:**
- 403 errors even though you're admin
- Error: "Failed to verify admin permissions"

**Solution:**
```bash
# Apply migration 007 which sets up RLS policies
cd supabase
supabase db push

# Or manually run the SQL from:
# supabase/migrations/007_admin_rls_policies.sql
```

### 6. API Route Not Found

**Symptoms:**
- Error: "L'endpoint de l'API no s'ha trobat" (404)

**Solution:**
```bash
# 1. Verify build includes API routes
cd apps/admin
pnpm build

# Check that .svelte-kit/output/server/entries/endpoints/api/ exists

# 2. For Cloudflare Pages, verify adapter config:
# In svelte.config.js, should use @sveltejs/adapter-cloudflare

# 3. For other platforms, ensure SSR is enabled
```

### 7. CORS Issues (if API is separate)

**Symptoms:**
- Browser console shows CORS errors
- Error: "Cross-Origin Request Blocked"

**Solution:**

If your API is on a different domain, configure CORS in your API:

```typescript
// In API configuration
{
  'Access-Control-Allow-Origin': 'https://your-admin-domain.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

For this app, API and frontend are on same domain, so CORS shouldn't be an issue.

### 8. Server Not Running (Local Development)

**Symptoms:**
- Error: "Failed to fetch"
- Cannot connect to localhost

**Solution:**
```bash
# 1. Start the dev server
pnpm --filter @agendaviva/admin dev

# 2. Verify it's running on the correct port
# Default is http://localhost:5173

# 3. Check for port conflicts
lsof -ti:5173  # Kill any processes using the port if needed

# 4. Try accessing the health endpoint
curl http://localhost:5173/api/health
```

### 9. Build/Deployment Issues

**Symptoms:**
- Works locally but fails in production
- Deployment logs show errors

**Solution:**

**Check build logs for:**
```
- Missing environment variables warnings
- Build failures
- Route generation errors
```

**Common fixes:**
```bash
# 1. Ensure all dependencies are in package.json
pnpm install

# 2. Run build locally first
pnpm build

# 3. Test production build locally
pnpm preview
# Then test at http://localhost:4173

# 4. Check adapter configuration
# For Cloudflare: @sveltejs/adapter-cloudflare
# For Vercel: @sveltejs/adapter-vercel
# For Netlify: @sveltejs/adapter-netlify
```

## Testing Your Setup

Run the API test script:

```bash
# Local
cd apps/admin
pnpm test:api

# Production (replace URL)
node test-api.js https://your-domain.com
```

This will check:
- ✅ Health endpoint accessibility
- ✅ Environment variables configured
- ✅ API endpoints return proper error codes
- ✅ Build output exists (local only)

## Step-by-Step Checklist

Use this checklist when setting up a new environment:

### Initial Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set `PUBLIC_SUPABASE_URL` in `.env`
- [ ] Set `PUBLIC_SUPABASE_ANON_KEY` in `.env`
- [ ] Run `pnpm install`

### Database Setup
- [ ] Apply migrations: `cd supabase && supabase db push`
- [ ] Verify tables exist in Supabase Dashboard
- [ ] Create first admin user in `admin_users` table

### Local Testing
- [ ] Start dev server: `pnpm dev`
- [ ] Visit `http://localhost:5173/api/health`
- [ ] Verify environment variables show as configured
- [ ] Sign up/sign in
- [ ] Visit `/activitats` page
- [ ] Verify activities load (or get proper error if no data)

### Production Deployment
- [ ] Set environment variables in hosting platform
- [ ] Trigger deployment
- [ ] Visit `/api/health` on production URL
- [ ] Sign in with admin account
- [ ] Test activities page loads

## Still Having Issues?

1. **Check server logs:**
   - Local: Check terminal where dev server is running
   - Cloudflare: Pages → Deployments → View logs
   - Vercel: Project → Deployments → Function logs
   - Netlify: Site → Functions → Logs

2. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors in red

3. **Enable verbose logging:**
   ```typescript
   // Temporarily add to components
   console.log('Session:', $session);
   console.log('User:', $user);
   ```

4. **Test with curl:**
   ```bash
   # Test health endpoint
   curl http://localhost:5173/api/health
   
   # Test activities endpoint (should get 401)
   curl http://localhost:5173/api/activitats
   ```

5. **Check GitHub Issues:**
   - Search for similar issues
   - Open a new issue with:
     - Error message
     - Health check response
     - Browser console logs
     - Deployment platform

## Additional Resources

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
