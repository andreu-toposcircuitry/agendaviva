# Agenda Viva - Admin Application

Production-grade admin interface for managing activities in the Agenda Viva platform.

## Overview

The Admin app provides a comprehensive interface for moderators and administrators to:
- Search, filter, and browse activities
- Edit activity details, including ND (neurodiversity) scores
- Publish/unpublish activities
- Manage moderation queue
- Perform bulk operations
- View audit logs

## Features

### 🔍 Activities List (`/activitats`)
- **Server-side pagination** with configurable page size (10, 20, 50, 100)
- **Full-text search** across activity names, descriptions, and tags
- **Advanced filters**:
  - Municipality (municipi)
  - Activity type (tipologia)
  - Status (estat: publicada, pendent, esborrany, arxivada, rebutjada)
  - Needs review flag
  - Confidence score range
  - ND score range
- **Column sorting** by name, status, confidence, ND score, creation/update dates
- **Quick actions**: Publish/unpublish directly from list
- **Bulk operations**: Select multiple activities for batch processing
- **Responsive design**: Table view on desktop, card view on mobile

### ✏️ Activity Editor (`/activitats/[id]`)
- **Comprehensive form** with all activity fields:
  - Basic info (name, description, typology, subtypology)
  - Location (municipality, neighborhood, venue, address, online flag)
  - Schedule (frequency, days, hours, start/end dates)
  - Age range (min, max, descriptive text)
  - Pricing (free text, min/max amounts, period, scholarships)
  - Contact (email, phone, website, registration link)
  - ND score and recommendations
  - Review status and reasons
- **Publish/unpublish** with validation (requires municipality and typology)
- **Queue management**: Add to or remove from review queue
- **Audit log panel**: View history of changes with user attribution
- **Source preview**: View original scraped text and agent response
- **Auto-save feedback**: Toast notifications for success/error states

### 📋 Moderation Queue (`/cua`)
- **Prioritized list** of activities needing review
- **Inline actions**:
  - **Accept & Publish**: Approve and make public immediately
  - **Accept & Keep Pending**: Mark as reviewed but don't publish
  - **Reject**: Mark as rejected with reason
  - **Edit**: Open in full editor
- **Bulk acceptance** with configurable safety thresholds:
  - Minimum confidence score
  - Minimum ND confidence score
  - Preview count before execution
- **Batch mark as reviewed**: Process multiple items at once
- **Priority badges**: Visual indicators for alta/mitjana/baixa priority

## Technical Architecture

### Authentication & Authorization

The app uses Supabase Auth with role-based access control:

1. **User Roles** (stored in `admin_users` table):
   - `admin`: Full access (can delete, manage users)
   - `moderator`: Can review and edit activities

2. **Session Management**:
   - Sessions handled via `hooks.server.ts`
   - User/session injected into `event.locals`
   - Protected routes check role before rendering

3. **API Endpoints** (all require authentication):
   ```
   GET    /api/activitats                    - List with pagination/filters
   GET    /api/activitats/[id]               - Get single activity
   PATCH  /api/activitats/[id]               - Update activity
   DELETE /api/activitats/[id]               - Delete activity (admin only)
   POST   /api/activitats/[id]/publish       - Publish/unpublish
   POST   /api/activitats/[id]/queue         - Add to queue
   DELETE /api/activitats/[id]/queue         - Remove from queue
   GET    /api/activitats/[id]/audit         - Get audit logs
   POST   /api/activitats/bulk               - Bulk operations
   ```

### Database Schema

**New Tables** (added in migrations 005-007):

```sql
-- Admin users with roles
admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz DEFAULT NOW(),
  is_active boolean DEFAULT TRUE
)

-- Audit trail of all admin actions
admin_activity_audit (
  id uuid PRIMARY KEY,
  action text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  activity_id uuid REFERENCES activitats(id),
  activity_name text,
  payload jsonb,
  created_at timestamptz DEFAULT NOW()
)
```

**RLS Policies**:
- Admins/moderators can read all activities
- Admins/moderators can update activities
- Only admins can delete activities
- Service role bypasses RLS for scraper operations

### Components

Reusable Svelte components in `src/lib/components/`:

- **Toast.svelte**: Toast notification system (success, error, warning, info)
- **ConfirmDialog.svelte**: Confirmation modal for destructive actions
- **Pagination.svelte**: Pagination controls with page size selector
- **MunicipiSelect.svelte**: Searchable municipality dropdown with autocomplete

### Utilities

Helper functions in `src/lib/utils/`:

- **auth.ts**: Authentication helpers (isAdmin, isModerator, requireAuth, etc.)
- **debounce.ts**: Debounce function for search inputs
- **format.ts**: Formatting helpers (dates, numbers, badge colors, truncation)

### State Management

Stores in `src/lib/stores/`:

- **auth.ts**: User authentication state (user, session, isAdmin, isModerator)
- **toast.ts**: Toast notification queue

## Setup & Installation

### Prerequisites

- Node.js 18+ and pnpm 8+
- Supabase project with database configured
- Admin app environment variables (see below)

### Environment Variables

Create `.env` file in `apps/admin/`:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Install Dependencies

From the repository root:

```bash
pnpm install
```

### Apply Migrations

Ensure the following migrations are applied to your Supabase database:

```bash
# From supabase/migrations/
001_initial_schema.sql          # Base schema
002_fix_search_rpc.sql          # Search function
003_service_role_rls_policies.sql # Service role access
004_add_whoami_rpc.sql          # Auth diagnostics
005_admin_users_table.sql       # Admin users table ⬅️ NEW
006_admin_activity_audit_table.sql # Audit log ⬅️ NEW
007_admin_rls_policies.sql      # Admin RLS policies ⬅️ NEW
```

Apply using Supabase CLI:

```bash
cd supabase
supabase db push
```

Or apply manually via Supabase Dashboard SQL Editor.

### Seed First Admin User

After migrations, you need to create your first admin user. You have two options:

#### Option 1: Via SQL (Recommended)

1. Sign up via the admin UI (creates auth.users entry)
2. Get your user ID from the UI or from auth.users table
3. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, email, role, is_active)
VALUES (
  'YOUR-USER-UUID',  -- Get this from auth.users or UI
  'your-email@example.com',
  'admin',
  true
);
```

#### Option 2: Via app_metadata (Alternative)

You can also use Supabase Auth user metadata:

1. In Supabase Dashboard → Authentication → Users
2. Find your user
3. Edit and add to user metadata:
   ```json
   {
     "role": "admin"
   }
   ```

Note: The app checks both `admin_users` table and `app_metadata.role`.

### Development

Start the dev server:

```bash
# From repository root
pnpm dev

# Or from apps/admin
cd apps/admin
pnpm dev
```

App runs on: `http://localhost:5173` (or next available port)

### Production Build

```bash
# From repository root
pnpm build

# Or from apps/admin
cd apps/admin
pnpm build
```

Output: `.svelte-kit/` directory (Cloudflare Pages adapter)

## Deployment

The admin app uses `@sveltejs/adapter-cloudflare` for Cloudflare Pages deployment.

### Deploy to Cloudflare Pages

1. **Connect Repository** in Cloudflare Dashboard
2. **Build Configuration**:
   - Build command: `pnpm --filter @agendaviva/admin build`
   - Build output directory: `apps/admin/.svelte-kit/cloudflare`
   - Root directory: (leave empty or set to `/`)
3. **Environment Variables**:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### Security Considerations

1. **Never expose service role key** in the admin app
   - Use anon/authenticated keys only
   - RLS policies enforce permissions server-side
   
2. **Always validate on server**:
   - All write operations go through API routes
   - API routes check `admin_users` table
   - Never trust client-side role checks alone

3. **Audit everything**:
   - All mutations write to `admin_activity_audit`
   - Include user_id, email, action, and payload
   - Retention policy: keep audit logs indefinitely

4. **Rate limiting** (recommended):
   - Add rate limiting middleware for bulk operations
   - Limit bulk operations to 500 activities per request

## Usage Guide

### For Moderators

1. **Review Queue**:
   - Go to `/cua` to see activities needing review
   - Click "Accept & Publish" for good activities
   - Click "Accept & Keep Pending" if needs minor edits
   - Click "Reject" for spam or irrelevant content
   - Use bulk operations for processing multiple items

2. **Edit Activities**:
   - Browse activities at `/activitats`
   - Use filters to find specific activities
   - Click activity name to edit
   - Update fields as needed
   - Click "Save Changes"

3. **Publish Activities**:
   - Ensure municipality and typology are set
   - Click "Publish" button
   - Confirmation dialog will appear
   - Activity becomes public immediately

### For Administrators

All moderator capabilities, plus:

1. **Manage Admin Users**:
   - Add new admins/moderators via SQL or API
   - Deactivate users by setting `is_active = false`

2. **Delete Activities**:
   - Only admins can delete
   - Use with caution (creates audit log)

3. **Bulk Operations**:
   - Select multiple activities
   - Choose operation (publish, mark reviewed, etc.)
   - Preview count before confirming
   - Monitor audit logs for batch changes

## Troubleshooting

### "Authentication required" error

- Check that you're logged in
- Verify your user exists in `admin_users` table
- Check `is_active = true`

### "Moderator role required" error

- Verify `role` in `admin_users` is 'admin' or 'moderator'
- Check RLS policies are applied correctly
- Run `SELECT * FROM admin_users WHERE user_id = auth.uid()` in SQL Editor

### Can't publish activity

- Ensure `municipi_id` is set
- Ensure `tipologia_principal` is set
- Check error message in toast for specific issue

### Bulk operations not working

- Check that activities meet safety criteria (confidence threshold)
- Verify RLS policies allow updates
- Check browser console and network tab for errors

### Search not working

- Verify `search_vector` column exists on `activitats` table
- Check that `plainto_tsquery` function is available
- Test search query manually in SQL Editor

## API Reference

### List Activities

```http
GET /api/activitats?page=1&pageSize=20&sortBy=updated_at&order=desc
  &q=search+query
  &municipi_id=granollers
  &tipologia_principal=esports
  &estat=publicada
  &needs_review=false
  &confianca_min=70
  &nd_score_min=3
```

**Response**:
```json
{
  "activities": [...],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

### Bulk Publish

```http
POST /api/activitats/bulk
Content-Type: application/json

{
  "operation": "bulk_publish",
  "activityIds": ["uuid1", "uuid2", ...],
  "confiancaThreshold": 70,
  "ndConfiancaThreshold": 70
}
```

**Response**:
```json
{
  "success": true,
  "count": 25,
  "updatedActivities": [...]
}
```

## Performance Considerations

- **Pagination**: Always enabled, default 20 items per page
- **Indexes**: search_vector, municipi_id, tipologia_principal, estat, nd_score
- **Debouncing**: 500ms delay on search input
- **Lazy loading**: Audit logs loaded on-demand
- **Bulk limits**: Max 500 activities per bulk operation

## Accessibility

- **ARIA labels** on all interactive elements
- **Keyboard navigation** supported throughout
- **Focus management** in modals and dialogs
- **Color contrast** meets WCAG AA standards
- **Screen reader** friendly with semantic HTML

## License

See LICENSE file in repository root.

## Support

For issues or questions:
- Open a GitHub issue in the repository
