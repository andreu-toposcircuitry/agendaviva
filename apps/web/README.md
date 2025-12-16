# @agendaviva/web

Public-facing Astro frontend for Agenda Viva VO.

## Features

- Mobile-first responsive design with Tailwind CSS
- Svelte islands for interactive components
- ND-readiness classification display
- Search with filters (municipality, category, ND level, age)
- Category and municipality browsing
- Activity detail pages with full ND information
- LocalStorage favorites

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home: search, categories, featured |
| `/cerca` | Search results with filters |
| `/activitat/[slug]` | Activity detail |
| `/categoria/[tipologia]` | Category listing |
| `/municipi/[id]` | Municipality listing |
| `/nd-friendly` | ND-score >= 4 activities |
| `/que-es-nd` | Educational page about ND |
| `/sobre` | About + WWH branding |
| `/proposa` | Submit activity form |

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

Create a `.env` file with:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- [Astro](https://astro.build) - Static site generator
- [Svelte 5](https://svelte.dev) - Interactive components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Supabase](https://supabase.com) - Backend/Database
