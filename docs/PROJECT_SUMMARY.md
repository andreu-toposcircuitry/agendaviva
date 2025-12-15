# Agenda Viva VO - Project Summary

## Overview

Agenda Viva VO is a community-driven directory of extracurricular and leisure activities for children and youth in Vallès Oriental (Catalonia). The unique differentiator is an AI-powered neurodivergent (ND) readiness score for each activity.

## Key Features Implemented

### 1. Database Schema (PostgreSQL + Supabase)
- **Tables**: activitats, entitats, cua_revisio, historial, fonts_scraping, favorits, municipis, transaccions
- **Full-text search** with Catalan and Spanish support
- **Geography support** for location-based features
- **Row Level Security** for public/private data
- **Automatic triggers** for audit logs and timestamp updates

### 2. AI-Powered Classification
- **OpenAI GPT-4o-mini** integration for activity classification
- **Comprehensive prompt** with detailed ND criteria
- Extracts: category, age range, schedule, price, ND score (1-5)
- **Confidence scoring** for classification quality
- **Batch processing** support with rate limiting

### 3. Frontend (Astro + Svelte)
**Pages:**
- `/` - Home with search, category grid, municipality filters
- `/cerca` - Advanced search with filters (municipality, category, age, ND score)
- `/activitat/[slug]` - Activity detail with full ND information
- `/categoria/[tipologia]` - Category-specific listings
- `/nd-friendly` - High ND-score activities (≥4)
- `/que-es-nd` - Educational content about neurodivergence
- `/sobre` - About the project
- `/proposa` - Activity submission form
- `/404` - Not found page

**Components:**
- `SearchBox.svelte` - Autocomplete search with suggestions
- `ActivityCard.svelte` - Activity card for listings
- `NDScore.svelte` - Visual ND score indicator
- `Base.astro` - Main layout with header/footer

**Features:**
- Mobile-responsive design with Tailwind CSS
- Client-side favorites management (localStorage)
- API endpoint for search suggestions
- Optimized for static generation

### 4. Web Scraper
- Framework for scraping multiple source types (web, Instagram, API)
- Integration with AI classifier
- Automatic insertion into Supabase
- Error handling and logging
- Review queue population for low-confidence items

### 5. GitHub Actions
- **Daily scraping workflow** (6 AM UTC)
- **Deployment workflow** to Cloudflare Pages
- Manual trigger support

### 6. Documentation
- **ND_CRITERIA.md** - Comprehensive ND scoring criteria with examples
- **EDITORIAL_GUIDELINES.md** - Classification rules and content standards
- **CONTRIBUTING.md** - Contribution guidelines for developers
- **README.md** - Setup instructions and project overview

## Technical Architecture

```
Frontend (Astro/Svelte)
    ↓ API calls
Supabase (PostgreSQL)
    ↑ Data storage
Scraper + AI Agent (Node.js + OpenAI)
    ↓ Classify & insert
Review Queue
    ↓ Human review
Published Activities
```

## ND Scoring System

Each activity receives a score from 1-5:

- **5**: Highly suitable (small groups, quiet, flexible, trained staff)
- **4**: Quite suitable (clear routines, adaptations available)
- **3**: Neutral (no clear indicators)
- **2**: May have barriers (large groups, noisy, competitive)
- **1**: Not suitable (multiple barriers, no flexibility)

Scores include:
- Justification text
- Positive indicators list
- Negative indicators list
- Recommendations
- Confidence level (0-100%)
- Verification source (inferred, reviewed, confirmed)

## Typologies

9 main categories:
1. **Sports** (futbol, bàsquet, natació, etc.)
2. **Visual Arts** (pintura, dibuix, ceràmica, etc.)
3. **Music** (instruments, singing, ensembles)
4. **Performing Arts** (theatre, dance, circus)
5. **Languages** (English, French, German, Chinese)
6. **Academic Support** (tutoring, study skills, speech therapy)
7. **Science & Technology** (robotics, coding, maker)
8. **Nature** (gardening, hiking, environmental education)
9. **Recreation** (day camps, colonies, play centers)

## Municipalities

18 municipalities in Vallès Oriental included:
- Granollers, Mollet del Vallès, La Garriga, Cardedeu, Sant Celoni, and more

## Data Flow

1. **Collection**: Scraper gathers activity info from public sources
2. **Classification**: OpenAI analyzes text and generates structured data
3. **Storage**: Data inserted into Supabase with confidence scores
4. **Review**: Low-confidence items added to review queue
5. **Publication**: Approved activities made public
6. **Verification**: Entities and families can confirm/update

## Future Enhancements

### High Priority
- [ ] Admin panel (SvelteKit) for review queue
- [ ] Entity verification system
- [ ] User feedback on ND scores
- [ ] Email notifications

### Medium Priority
- [ ] Cloudflare Email Worker for activity submissions
- [ ] Stripe integration for donations
- [ ] Map view for activities
- [ ] Calendar export (iCal)

### Low Priority
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Social media sharing
- [ ] Activity recommendations based on profile

## Configuration Required

Before deploying, you need:

1. **Supabase Project**
   - Create project at supabase.com
   - Run migration: `supabase/migrations/001_initial_schema.sql`
   - Optional: Run seed data: `supabase/seed.sql`

2. **OpenAI API Key**
   - Sign up at openai.com
   - Create API key with GPT-4 access

3. **Cloudflare Account** (for deployment)
   - Create account at cloudflare.com
   - Set up Pages project
   - Configure GitHub integration

4. **GitHub Secrets**
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`
   - `PUBLIC_SITE_URL`

## Cost Estimation

**Monthly costs for 1000 activities:**

- **Supabase**: Free tier (up to 500MB database)
- **OpenAI**: ~$5-10 (classification, $0.15/1M tokens input, $0.60/1M tokens output)
- **Cloudflare Pages**: Free tier (unlimited requests)
- **Cloudflare Workers**: Free tier (100k requests/day)

**Total**: ~$5-10/month initially, scaling with usage

## Performance

- **Static generation**: Pages pre-rendered for fast loading
- **Database indexes**: Optimized queries on municipality, category, ND score
- **Full-text search**: Fast text search in Catalan and Spanish
- **CDN**: Cloudflare Pages globally distributed

## Security

- **Row Level Security**: Public can only read published activities
- **Environment variables**: Sensitive keys in env vars, not code
- **Input validation**: Type checking and sanitization
- **No PII exposure**: Personal data (proposer email) not public

## Accessibility

- **Semantic HTML**: Proper heading hierarchy, landmarks
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: All interactive elements accessible
- **Color contrast**: WCAG AA compliant
- **Mobile-friendly**: Responsive design, touch-friendly

## Localization

- **Primary**: Catalan (ca-ES)
- **Future**: Spanish (es-ES), English (en-GB)

All UI text currently in Catalan, following Catalan language guidelines.

## Testing Strategy

**Manual testing recommended for:**
- All page routes and navigation
- Search functionality with various filters
- Activity submission form
- ND score display and explanations
- Mobile responsiveness

**Automated testing (future):**
- Unit tests for classifier
- Integration tests for API endpoints
- E2E tests for critical user flows

## Maintenance

**Weekly:**
- Review queue processing (manual)
- Check scraper logs for errors

**Monthly:**
- Update activity information
- Review ND score accuracy
- Check for duplicates

**Quarterly:**
- Audit municipality data
- Update typologies if needed
- Review editorial guidelines

## Community Involvement

- **Activity proposals**: Via web form
- **Error reports**: Via GitHub issues or web form
- **ND score feedback**: From families with direct experience
- **Code contributions**: Via GitHub pull requests

## License

MIT License - Open source project

## Contact

- **Project**: Weird Wired Humans
- **Email**: agendaviva.vo@weirdwiredhumans.cat
- **Website**: weirdwiredhumans.com
- **GitHub**: github.com/andreu-toposcircuitry/agendaviva

---

Built with ❤️ for the neurodivergent community of Vallès Oriental
