# Admin Activities UI - Deployment Guide

This document provides step-by-step instructions for deploying the production-grade Admin Activities UI.

## Pre-Deployment Checklist

- [ ] All database migrations applied (001-007)
- [ ] First admin user created in `admin_users` table
- [ ] Environment variables configured
- [ ] Application builds successfully
- [ ] RLS policies tested and working
- [ ] Audit logging verified
- [ ] Security review completed

## Database Migrations

### Apply All Migrations

The following migrations must be applied in order:

```sql
-- 001_initial_schema.sql (already applied)
-- 002_fix_search_rpc.sql (already applied)
-- 003_service_role_rls_policies.sql (already applied)
-- 004_add_whoami_rpc.sql (already applied)

-- NEW MIGRATIONS FOR ADMIN UI:

-- 005_admin_users_table.sql
-- Creates admin_users table with roles and RLS policies

-- 006_admin_activity_audit_table.sql
-- Creates audit log table for tracking admin actions

-- 007_admin_rls_policies.sql
-- Adds RLS policies allowing admin/moderator access to activitats
```

### Using Supabase CLI

```bash
cd supabase
supabase db push
```

### Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration file content
3. Execute in order (005, 006, 007)
4. Verify no errors

### Verify Migrations

Run this query to verify:

```sql
-- Check admin_users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'admin_activity_audit');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('activitats', 'admin_users', 'admin_activity_audit', 'cua_revisio');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected: Should see tables exist, RLS enabled, and multiple policies per table.

## Create First Admin User

### Step 1: Sign Up via UI

1. Navigate to the admin app URL
2. Sign up with email (creates entry in `auth.users`)
3. Check your email for verification link (if email verification enabled)

### Step 2: Get User ID

Option A - Via SQL:
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

Option B - Via Supabase Dashboard:
- Go to Authentication → Users
- Find your user and copy the UUID

### Step 3: Add to admin_users

```sql
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES (
  'YOUR-USER-UUID-HERE',  -- Replace with actual UUID
  'your-email@example.com',  -- Replace with your email
  'admin',  -- 'admin' or 'moderator'
  true
);
```

### Step 4: Verify Access

```sql
-- As the authenticated user, run:
SELECT * FROM admin_users WHERE user_id = auth.uid();

-- Should return your admin user record
```

## Environment Variables

### Required Variables

Create `.env` file or configure in deployment platform:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Analytics, monitoring, etc.
# PUBLIC_ANALYTICS_ID=xxx
```

### Security Notes

- ✅ **Use**: `SUPABASE_ANON_KEY` (anon key) - safe for public
- ❌ **Never use**: `SUPABASE_SERVICE_ROLE_KEY` in frontend
- RLS policies enforce security, not key types

## Build Application

### Development Build

```bash
# From repository root
pnpm install
pnpm --filter @agendaviva/admin build

# Or from apps/admin
cd apps/admin
pnpm install
pnpm build
```

### Verify Build

Check for `.svelte-kit/` directory with build output.

### Build Troubleshooting

**TypeScript errors:**
- Run `pnpm check` to see type errors
- Fix any type issues before deployment

**Missing dependencies:**
- Run `pnpm install` again
- Check `package.json` for correct versions

**Build fails:**
- Check Node.js version (18+ required)
- Clear `.svelte-kit` and rebuild
- Check for syntax errors in Svelte files

## Deploy to Cloudflare Pages

### Via Cloudflare Dashboard

1. **Login** to Cloudflare Dashboard
2. **Pages** → Create a project
3. **Connect to Git** → Select repository
4. **Build Settings**:
   - Framework preset: `SvelteKit`
   - Build command: `pnpm --filter @agendaviva/admin build`
   - Build output directory: `apps/admin/.svelte-kit/cloudflare`
   - Root directory: `/` (or leave empty)
5. **Environment Variables**:
   - Add `PUBLIC_SUPABASE_URL`
   - Add `PUBLIC_SUPABASE_ANON_KEY`
6. **Save and Deploy**

### Via Wrangler CLI

```bash
# Install Wrangler
pnpm add -g wrangler

# Login
wrangler login

# Deploy
cd apps/admin
pnpm build
wrangler pages deploy .svelte-kit/cloudflare
```

### Custom Domain Setup

1. In Cloudflare Pages project
2. **Custom domains** → Add a domain
3. Follow DNS setup instructions
4. SSL/TLS certificate automatically provisioned

## Deploy to Other Platforms

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/admin
vercel

# Production deployment
vercel --prod
```

Environment variables: Add via Vercel Dashboard

### Netlify

```toml
# netlify.toml
[build]
  command = "pnpm --filter @agendaviva/admin build"
  publish = "apps/admin/.svelte-kit/netlify"

[build.environment]
  NODE_VERSION = "18"
```

Deploy: Connect Git repo in Netlify Dashboard

## Post-Deployment Verification

### 1. Test Authentication

- [ ] Navigate to admin URL
- [ ] Sign in with admin credentials
- [ ] Verify you're redirected to dashboard
- [ ] Check no console errors

### 2. Test Activities List

- [ ] Go to `/activitats`
- [ ] Verify activities load
- [ ] Test search functionality
- [ ] Test filters
- [ ] Test sorting
- [ ] Test pagination

### 3. Test Activity Editor

- [ ] Click an activity to edit
- [ ] Modify some fields
- [ ] Click "Save Changes"
- [ ] Verify toast notification appears
- [ ] Reload page and verify changes saved

### 4. Test Publish/Unpublish

- [ ] Open an activity with valid municipi and tipologia
- [ ] Click "Publish"
- [ ] Verify confirmation dialog
- [ ] Confirm and verify success toast
- [ ] Check `estat` changed to 'publicada'

### 5. Test Queue Management

- [ ] Go to `/cua`
- [ ] Verify queue items load
- [ ] Test "Accept & Publish" on an item
- [ ] Verify item removed from queue
- [ ] Test batch operations

### 6. Test Audit Logging

- [ ] Open an activity
- [ ] Click "Show Audit"
- [ ] Verify audit logs appear
- [ ] Check recent actions are logged

### 7. Test RLS Policies

```sql
-- As authenticated admin user, should succeed:
SELECT * FROM activitats LIMIT 1;
UPDATE activitats SET descripcio = 'Test' WHERE id = 'some-uuid';

-- As anonymous user, should fail:
-- (logout and try same queries)
```

### 8. Test Security

- [ ] Logout and try to access `/activitats` (should redirect to login)
- [ ] Try API endpoints without authentication (should return 401)
- [ ] Check network tab for exposed secrets (should find none)
- [ ] Verify service role key not in client bundle

## Monitoring & Logging

### Application Logs

**Cloudflare:**
- Pages → Project → View deployment → Logs

**Vercel:**
- Project → Logs tab

**Netlify:**
- Site → Logs tab

### Database Monitoring

**Supabase Dashboard:**
- Database → Logs
- Monitor slow queries
- Check for errors

### Audit Log Queries

```sql
-- Recent admin actions
SELECT action, user_email, activity_name, created_at
FROM admin_activity_audit
ORDER BY created_at DESC
LIMIT 50;

-- Actions by user
SELECT action, COUNT(*) as count
FROM admin_activity_audit
WHERE user_email = 'admin@example.com'
GROUP BY action;

-- Bulk operations
SELECT *
FROM admin_activity_audit
WHERE action LIKE 'bulk_%'
ORDER BY created_at DESC;
```

## Rollback Procedure

### If issues arise after deployment:

1. **Revert to previous deployment**:
   - Cloudflare: Deployments → Previous deployment → Rollback
   - Vercel: Deployments → Previous → Promote to Production
   - Netlify: Deploys → Previous → Publish deploy

2. **Revert database migrations** (if needed):
   ```sql
   -- Disable new RLS policies
   DROP POLICY IF EXISTS "Admins and moderators can read all activitats" ON activitats;
   -- ... (drop other new policies)
   
   -- Drop new tables
   DROP TABLE IF EXISTS admin_activity_audit;
   DROP TABLE IF EXISTS admin_users;
   ```

3. **Notify team** of rollback and reason

4. **Investigate and fix** root cause

5. **Test fix** in staging environment

6. **Re-deploy** when ready

## Troubleshooting

### Build Fails

- Check Node.js version matches requirements (18+)
- Clear build cache: `rm -rf .svelte-kit`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `pnpm check`

### Authentication Issues

- Verify Supabase URL and anon key are correct
- Check RLS policies are applied: `SELECT * FROM pg_policies`
- Verify admin_users table has entries
- Test auth flow in incognito window

### API Errors

- Check server logs for detailed errors
- Verify API routes exist in `.svelte-kit/output`
- Test endpoints with curl/Postman
- Check CORS settings if applicable

### Performance Issues

- Monitor database query performance
- Check for missing indexes
- Enable caching where appropriate
- Consider CDN for static assets

## Security Best Practices

1. **Never commit** `.env` files
2. **Rotate keys** regularly
3. **Monitor audit logs** for suspicious activity
4. **Enable 2FA** for admin accounts
5. **Review RLS policies** quarterly
6. **Update dependencies** regularly
7. **Scan for vulnerabilities**: `pnpm audit`

## Maintenance Schedule

- **Daily**: Check error logs
- **Weekly**: Review audit logs
- **Monthly**: Update dependencies
- **Quarterly**: Security review
- **Annually**: Full security audit

## Support

For deployment issues:
1. Check this guide thoroughly
2. Review error logs
3. Test in local environment
4. Open GitHub issue with:
   - Deployment platform
   - Error messages
   - Steps to reproduce
   - Environment details

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0
