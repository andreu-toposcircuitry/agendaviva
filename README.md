# Agenda Viva VO 🌈

Directori participatiu d'activitats extraescolars i de lleure per a infants i joves al Vallès Oriental (Catalunya), amb puntuació d'adequació per a persones neurodivergents.

**Projecte de [Weird Wired Humans](https://weirdwiredhumans.com)**

## Característiques principals

- 🔍 **Cercador avançat**: Filtra per municipi, categoria, edat, puntuació ND
- 🤖 **Classificació IA**: Sistema automàtic amb OpenAI per classificar activitats
- 🌟 **Puntuació ND**: Cada activitat té una puntuació d'adequació neurodivergent (1-5)
- 📊 **Transparència**: Nivell de confiança i justificació de cada puntuació
- 🔄 **Actualització automàtica**: Scraping diari de fonts públiques
- 👥 **Verificació comunitària**: Les entitats i famílies poden confirmar informació
- 📱 **Responsive**: Optimitzat per mòbil, tauleta i escriptori

## Stack tecnològic

- **Frontend**: Astro + Svelte + Tailwind CSS
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI GPT-4o-mini per classificació
- **Scraping**: Node.js amb Cheerio
- **Hosting**: Cloudflare Pages + Workers
- **CI/CD**: GitHub Actions

## Estructura del projecte

```
agendaviva/
├── apps/
│   ├── web/              # Frontend Astro
│   └── admin/            # Panel SvelteKit (TODO)
├── packages/
│   ├── agent/            # Classificador IA
│   ├── scraper/          # Web scraping
│   └── shared/           # Types i utilitats compartides
├── workers/
│   └── email-ingestion/  # Cloudflare Email Worker (TODO)
├── supabase/
│   └── migrations/       # Esquema de base de dades
└── docs/                 # Documentació
```

## Instal·lació

### Prerequisits

- Node.js 20+
- npm 10+
- Compte Supabase
- API Key d'OpenAI

### Configuració

1. Clona el repositori:
```bash
git clone https://github.com/andreu-toposcircuitry/agendaviva.git
cd agendaviva
```

2. Instal·la dependències:
```bash
npm install
```

3. Configura variables d'entorn:
```bash
cp .env.example .env
```

Edita `.env` amb les teves credencials:
```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Public (per frontend)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
PUBLIC_SITE_URL=http://localhost:4321
```

4. Configura la base de dades:
```bash
# Instal·la Supabase CLI si no el tens
npm install -g supabase

# Aplica les migracions
supabase db push
```

### Desenvolupament

```bash
# Inicia el frontend
npm run dev -w apps/web

# En un altre terminal, executa el scraper (opcional)
npm run scrape
```

El frontend estarà disponible a http://localhost:4321

##Ús

### Frontend web

El directori públic es genera estàticament amb Astro i utilitza Svelte per components interactius.

**Pàgines principals:**
- `/` - Home amb cercador
- `/cerca` - Resultats de cerca amb filtres
- `/activitat/[slug]` - Detall d'activitat
- `/categoria/[tipologia]` - Activitats per categoria
- `/nd-friendly` - Activitats amb ND ≥ 4
- `/que-es-nd` - Informació sobre neurodivergència
- `/sobre` - Sobre el projecte
- `/proposa` - Formulari per proposar activitats

### Scraper

El scraper recopila activitats de fonts públiques i les classifica amb IA:

```bash
npm run scrape -w packages/scraper
```

### Agent classificador

L'agent utilitza OpenAI per analitzar text i generar fitxes estructurades:

```typescript
import { ActivityClassifier } from '@agendaviva/agent';

const classifier = new ActivityClassifier(process.env.OPENAI_API_KEY);

const result = await classifier.classify({
  text: "Taller de pintura per a nens de 6 a 10 anys...",
  context: { source: "Web Ajuntament" }
});
```

## Puntuació ND

Cada activitat té una puntuació d'adequació per a persones neurodivergents:

- **5**: Molt adequat (grups molt reduïts, professionals especialitzats, adaptacions)
- **4**: Bastant adequat (grups petits, rutines clares, flexible)
- **3**: Neutre (sense indicadors clars)
- **2**: Pot tenir barreres (grups grans, sorollós, competitiu)
- **1**: Poc adequat (múltiples barreres identificades)

Consulteu [docs/ND_CRITERIA.md](docs/ND_CRITERIA.md) per més detalls.

## Contribució

Llegiu [docs/EDITORIAL_GUIDELINES.md](docs/EDITORIAL_GUIDELINES.md) per conèixer els criteris editorials.

### Com contribuir

1. Fork el projecte
2. Crea una branca per la teva feature (`git checkout -b feature/nova-feature`)
3. Commit els canvis (`git commit -m 'Afegeix nova feature'`)
4. Push a la branca (`git push origin feature/nova-feature`)
5. Obre un Pull Request

## Roadmap

- [x] Esquema de base de dades
- [x] Agent classificador amb OpenAI
- [x] Frontend Astro amb components Svelte
- [x] Scraper bàsic
- [ ] Panel d'administració SvelteKit
- [ ] GitHub Actions per scraping diari
- [ ] Cloudflare Email Worker
- [ ] Sistema de verificació d'entitats
- [ ] API pública
- [ ] Integració Stripe per donacions

## Llicència

MIT License - veure [LICENSE](LICENSE)

## Contacte

- **Web**: [weirdwiredhumans.com](https://weirdwiredhumans.com)
- **Email**: agendaviva.vo@weirdwiredhumans.cat
- **GitHub**: [@andreu-toposcircuitry](https://github.com/andreu-toposcircuitry)

---

Fet amb ❤️ per a la comunitat neurodivergent del Vallès Oriental
