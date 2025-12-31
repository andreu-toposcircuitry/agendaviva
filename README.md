# Agenda Viva VO

> Directori participatiu d'activitats per a infants i joves al Vallès Oriental

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/andreu-toposcircuitry/agendaviva-vo/actions/workflows/ci.yml/badge.svg)](https://github.com/andreu-toposcircuitry/agendaviva-vo/actions/workflows/ci.yml)

## Què és?

Agenda Viva VO és un directori d'activitats extraescolars, culturals i de lleure per a infants i joves del Vallès Oriental. El que el fa únic és la **classificació ND-readiness**: cada activitat rep una puntuació de com d'adaptada està per a infants neurodivergents (TDAH, TEA, alta sensibilitat).

## Característiques

- 🔍 **Cerca per municipi, edat, tipologia**
- ♿ **Filtre ND-readiness** (únic a Catalunya)
- 🤖 **Agent IA** (GPT-4o-mini) que classifica activitats automàticament
- 👥 **Revisió humana** per casos límit
- 📧 **Ingesta per email** (les entitats envien, l'agent processa)
- 💚 **Gratuït i obert**

## Arquitectura

```
apps/web        → Frontend públic (Astro + Svelte)
apps/admin      → Panel d'administració (SvelteKit)
packages/shared → Tipus, constants, validadors (Zod)
packages/agent  → Agent classificador (OpenAI GPT-4o-mini)
packages/scraper→ Scraping de fonts
workers/email   → Ingesta d'emails (Cloudflare)
supabase/       → Esquema de base de dades
```

## Desenvolupament

```bash
# Instal·lar dependències
pnpm install

# Executar en mode dev
pnpm dev

# Construir per producció
pnpm build

# Executar tests
pnpm test

# Executar scraper
pnpm --filter @agendaviva/scraper scrape
```

## Variables d'Entorn

**Important:** Abans d'executar l'aplicació, has de configurar les variables d'entorn.

Copia `.env.example` a `.env` i configura amb les teves credencials de Supabase:

```bash
cp .env.example .env
# Edita .env amb les teves credencials
```

Variables requerides:

```
# Supabase (obligatori)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenAI (per l'agent classificador)
OPENAI_API_KEY=sk-...

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Públic
PUBLIC_SITE_URL=https://agendaviva.cat
PUBLIC_FORMSPREE_ID=...
```

**Per més detalls:** Consulta la [guia de configuració d'entorn](docs/ENVIRONMENT_SETUP.md)

## Documentació

- [Guia de configuració d'entorn](docs/ENVIRONMENT_SETUP.md) - Com configurar variables d'entorn
- [Guia de resolució de problemes](docs/TROUBLESHOOTING.md) - Solucions a errors comuns
- [Guia de desplegament](DEPLOYMENT_GUIDE.md) - Desplegament a producció
- [Criteris editorials](docs/EDITORIAL_GUIDELINES.md)
- [Criteris ND](docs/ND_CRITERIA.md)
- [Com contribuir](docs/CONTRIBUTING.md)

## Crèdits

Un projecte de [Weird Wired Humans](https://weirdwiredhumans.com)

---

*Amb el suport de la comunitat del Vallès Oriental*
