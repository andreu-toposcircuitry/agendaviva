# Agenda Viva VO

> Directori participatiu d'activitats per a infants i joves al Vallès Oriental

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Què és?

Agenda Viva VO és un directori d'activitats extraescolars, culturals i de lleure per a infants i joves del Vallès Oriental. El que el fa únic és la **classificació ND-readiness**: cada activitat rep una puntuació de com d'adaptada està per a infants neurodivergents (TDAH, TEA, alta sensibilitat).

## Característiques

- **Cerca per municipi, edat, tipologia**
- **Filtre ND-readiness** (únic a Catalunya)
- **Agent IA** que classifica activitats automàticament
- **Revisió humana** per casos límit
- **Ingesta per email** (les entitats envien, l'agent processa)
- **Gratuït i obert**

## Arquitectura

```
apps/web        → Frontend públic (Astro + Svelte)
apps/admin      → Panel d'administració (SvelteKit)
packages/agent  → Agent classificador (Claude Haiku)
packages/scraper→ Scraping de fonts
workers/email   → Ingesta d'emails (Cloudflare)
```

## Desenvolupament

```bash
# Instal·lar dependències
pnpm install

# Executar en mode dev
pnpm dev

# Construir per producció
pnpm build
```

## Documentació

- [Criteris editorials](docs/EDITORIAL_GUIDELINES.md)
- [Criteris ND](docs/ND_CRITERIA.md)
- [Com contribuir](docs/CONTRIBUTING.md)

## Crèdits

Un projecte de [Weird Wired Humans](https://weirdwiredhumans.com)

---

*Amb el suport de la comunitat del Vallès Oriental*
