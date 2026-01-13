# Quick Start Guide - Admin Application

Get the admin application up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A Supabase project (create one at [supabase.com](https://supabase.com))

## Step 1: Clone & Install (1 min)

```bash
# Clone the repository
git clone https://github.com/andreu-toposcircuitry/agendaviva.git
cd agendaviva

# Install dependencies
pnpm install
```

## Step 2: Configure Environment (2 min)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your Supabase credentials
# Get these from: https://app.supabase.com/project/_/settings/api
```

Your `.env` should look like:
```bash
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 3: Setup Database (1 min)

```bash
# Apply database migrations
cd supabase
supabase db push
```

## Step 4: Start Development Server (30 sec)

```bash
# Go back to root
cd ..

# Start the admin app
pnpm --filter @agendaviva/admin dev
```

Visit: **http://localhost:5173**

## Step 5: Create Your Admin User (30 sec)

1. Sign up through the UI
2. Get your user ID from Supabase Dashboard (Authentication → Users)
3. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES (
  'your-uuid-here',
  'your-email@example.com',
  'admin',
  true
);
```

4. Refresh the page - you should now see the admin interface!

## Verify Everything Works

Run the test suite:
```bash
cd apps/admin
pnpm test:api
```

Visit the health check:
```
http://localhost:5173/api/health
```

You should see:
```json
{
  "status": "ok",
  "checks": {
    "environment": {
      "status": "ok",
      "details": {
        "PUBLIC_SUPABASE_URL": true,
        "PUBLIC_SUPABASE_ANON_KEY": true
      }
    }
  }
}
```

## Common Issues

### "Environment variables not configured"
- Make sure you copied `.env.example` to `.env`
- Verify `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the dev server after changing `.env`

### "Authentication required"
- You need to sign up and add yourself to `admin_users` table
- See Step 5 above

### "Failed to fetch activities"
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions
- Run `pnpm test:api` to diagnose issues

## Next Steps

- Read [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if you encounter issues
- Review [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for production deployment

## Development Workflow

```bash
# Start development
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run type checking
cd apps/admin && pnpm check

# Test API endpoints
cd apps/admin && pnpm test:api
```

## Project Structure

```
apps/admin/          → Admin SvelteKit application
  src/
    routes/          → Page routes
      activitats/    → Activities management
      cua/          → Review queue
      api/          → API endpoints
    lib/            → Shared utilities
docs/               → Documentation
supabase/           → Database migrations
```

## Getting Help

1. Check the health endpoint: `/api/health`
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Run test script: `pnpm test:api`
4. Open a GitHub issue with:
   - Error messages
   - Health check output
   - Steps to reproduce

---

**Happy coding! 🚀**
