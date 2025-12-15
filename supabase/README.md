# Supabase Database Schema

This directory contains the database schema for Agenda Viva VO.

## Structure

```
supabase/
├── config.toml              # Supabase local development configuration
├── migrations/              # Database migrations
│   └── 001_initial_schema.sql  # Complete initial schema
└── seed.sql                 # Seed data (to be implemented in P12)
```

## Migration 001: Initial Schema

The initial schema creates the complete database structure for Agenda Viva VO:

### Tables (10)

1. **municipis** - 42 municipalities of Vallès Oriental
2. **entitats** - Organizations that offer activities
3. **activitats** - Activities (core content)
4. **cua_revisio** - Review queue for moderation
5. **historial** - Audit log
6. **fonts_scraping** - Web scraping sources
7. **emails_ingestats** - Email ingestion log
8. **favorits** - User favorites
9. **entitat_claims** - Entity ownership claims
10. **transaccions** - Payments and donations

### Views (3)

- **activitats_public** - Public view of published activities
- **cua_revisio_detall** - Review queue with details
- **stats_dashboard** - Admin dashboard statistics

### Functions (4)

- **update_updated_at()** - Auto-update timestamp trigger
- **generate_slug()** - Generate URL-friendly slugs
- **log_activitat_changes()** - Audit trail for activities
- **search_activitats()** - Full-text search with filters

### Security

- **Row Level Security (RLS)** enabled on 7 tables
- **10 RLS policies** for granular access control
- **Proper grants** for anon, authenticated, and service roles

## Key Features

### ND Readiness
Each activity has a neurodiversity readiness score (1-5):
- `nd_score` - Numeric score
- `nd_nivell` - Level description
- `nd_justificacio` - Reasoning
- `nd_indicadors_positius/negatius` - Positive/negative indicators
- `nd_recomanacions` - Recommendations

### Full-Text Search
- Generated `tsvector` column with Spanish language support
- Searches across name, description, space, and tags
- Weighted by relevance (name > description > space/tags)

### Soft Deletes
Activities are never deleted, only archived using the `estat` column.

### Audit Trail
All changes to activities are logged to the `historial` table.

## Applying the Migration

To apply this migration to your Supabase project:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using migration commands
supabase migration up

# Option 3: Copy SQL directly to Supabase SQL Editor
```

## Success Criteria

✅ All 10 tables created  
✅ All 3 views created  
✅ All 4 functions created  
✅ 10 RLS policies configured  
✅ 42 municipalities inserted  
✅ Full-text search enabled  
✅ Audit logging configured  
✅ Security policies in place  

## Next Steps

See [P03: Shared Package](../docs/P03_shared_package.md) for TypeScript type generation from this schema.
