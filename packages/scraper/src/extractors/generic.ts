import * as cheerio from 'cheerio';

export interface ExtractedBlock {
  text: string;
  url?: string;
  title?: string;
  sourceSelector?: string;
}

export interface ExtractorConfig {
  selectors?: string[];
  minTextLength?: number;
  maxTextLength?: number;
  excludeSelectors?: string[];
}

const DEFAULT_CONFIG: ExtractorConfig = {
  selectors: [
    'article',
    '.activity',
    '.activitat',
    '.event',
    '.card',
    '[class*="activity"]',
    '[class*="event"]',
  ],
  minTextLength: 100,
  maxTextLength: 5000,
  excludeSelectors: [
    'nav',
    'header',
    'footer',
    '.menu',
    '.cookie',
    '.advertisement',
  ],
};

/**
 * Extract activity-related content blocks from HTML
 */
export function extractActivityBlocks(
  html: string,
  baseUrl: string,
  config: ExtractorConfig = {}
): ExtractedBlock[] {
  const { selectors, minTextLength, maxTextLength, excludeSelectors } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const $ = cheerio.load(html);

  // Remove excluded elements
  excludeSelectors?.forEach((sel) => $(sel).remove());

  const blocks: ExtractedBlock[] = [];
  const seenTexts = new Set<string>();

  // Try specific selectors first
  for (const selector of selectors || []) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim().replace(/\s+/g, ' ');

      // Skip if already seen (dedup)
      const textKey = text.slice(0, 200);
      if (seenTexts.has(textKey)) return;

      if (text.length >= (minTextLength || 0) && text.length <= (maxTextLength || Infinity)) {
        const link = $el.find('a').first().attr('href');
        const title = $el.find('h1, h2, h3, h4, .title').first().text().trim();

        seenTexts.add(textKey);
        blocks.push({
          text,
          url: link ? resolveUrl(link, baseUrl) : undefined,
          title: title || undefined,
          sourceSelector: selector,
        });
      }
    });
  }

  // If no blocks found, try to extract from main content
  if (blocks.length === 0) {
    const mainContent = $('main, .content, #content, article').first();
    if (mainContent.length) {
      const text = mainContent.text().trim().replace(/\s+/g, ' ');
      if (text.length >= (minTextLength || 0)) {
        blocks.push({
          text: text.slice(0, maxTextLength),
          sourceSelector: 'main-fallback',
        });
      }
    }
  }

  return blocks;
}

/**
 * Check if text likely contains activity information
 */
export function isLikelyActivity(text: string): boolean {
  const activityKeywords = [
    // Catalan
    'inscripció', 'matrícula', 'horari', 'preu', 'edat', 'anys',
    'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte',
    'curs', 'taller', 'classes', 'activitat', 'escola', 'esplai',
    'natació', 'futbol', 'bàsquet', 'dansa', 'música', 'teatre',
    // Spanish
    'inscripción', 'matrícula', 'horario', 'precio', 'edad', 'años',
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
    'curso', 'taller', 'clases', 'actividad', 'escuela',
    'natación', 'fútbol', 'baloncesto', 'danza', 'música', 'teatro',
  ];

  const lowerText = text.toLowerCase();
  const matches = activityKeywords.filter((kw) => lowerText.includes(kw));

  return matches.length >= 3;
}

/**
 * Extract all links from HTML that might lead to activity pages
 */
export function extractActivityLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const seenUrls = new Set<string>();

  const activityPatterns = [
    /activit/i,
    /curs/i,
    /taller/i,
    /inscripci/i,
    /agenda/i,
    /event/i,
  ];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().toLowerCase();

    if (!href) return;

    // Check if link text or URL suggests activity content
    const isActivityLink = activityPatterns.some(
      (p) => p.test(href) || p.test(text)
    );

    if (isActivityLink) {
      const resolved = resolveUrl(href, baseUrl);
      if (resolved && !seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        links.push(resolved);
      }
    }
  });

  return links;
}

/**
 * Safely resolve a relative URL against a base URL
 */
function resolveUrl(href: string, baseUrl: string): string | undefined {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return undefined;
  }
}
