import * as cheerio from 'cheerio';
import type { ExtractedBlock } from './generic.js';

/**
 * Specialized extractor for Catalan municipal websites
 * They often follow similar patterns (Drupal, WordPress municipal themes, etc.)
 */
export function extractFromAjuntament(html: string, baseUrl: string): ExtractedBlock[] {
  const $ = cheerio.load(html);
  const blocks: ExtractedBlock[] = [];
  const seenTexts = new Set<string>();

  // Common patterns for municipal activity pages
  const patterns = [
    // Granollers style
    '.contingut-detall',
    '.fitxa-activitat',
    // Generic municipal
    '.activitat-item',
    '.agenda-item',
    '.event-item',
    '.servei-item',
    // Drupal-based (common in Catalan municipalities)
    '.node-activitat',
    '.node-event',
    '.view-activitats .views-row',
    '.view-agenda .views-row',
    '.view-cursos .views-row',
    // WordPress municipal themes
    '.tribe-events-single',
    '.type-tribe_events',
    '.em-event',
    // Common class patterns
    '[class*="activitat"]',
    '[class*="cursos"]',
    '[class*="inscripcions"]',
  ];

  for (const pattern of patterns) {
    $(pattern).each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim().replace(/\s+/g, ' ');

      // Deduplicate
      const textKey = text.slice(0, 200);
      if (seenTexts.has(textKey)) return;

      if (text.length > 100) {
        const href = $el.find('a').first().attr('href');
        let url: string | undefined;
        try {
          url = href ? new URL(href, baseUrl).href : undefined;
        } catch {
          url = undefined;
        }

        seenTexts.add(textKey);
        blocks.push({
          text,
          url,
          title: $el.find('h2, h3, .title, .nom').first().text().trim() || undefined,
          sourceSelector: pattern,
        });
      }
    });
  }

  return blocks;
}

/**
 * Extract activity detail from a single activity page
 */
export function extractActivityDetail(html: string, baseUrl: string): ExtractedBlock | null {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('nav, header, footer, .menu, .sidebar, .cookie-banner, script, style').remove();

  // Look for main content container
  const contentSelectors = [
    '.contingut-principal',
    '.contingut-detall',
    '.fitxa-activitat',
    'main article',
    '.content article',
    'article.activitat',
    '.node-content',
    '#contingut',
  ];

  for (const selector of contentSelectors) {
    const $content = $(selector).first();
    if ($content.length) {
      const text = $content.text().trim().replace(/\s+/g, ' ');
      if (text.length > 100) {
        return {
          text: text.slice(0, 5000),
          title: $('h1').first().text().trim() || undefined,
          url: baseUrl,
          sourceSelector: selector,
        };
      }
    }
  }

  // Fallback: get body content
  const bodyText = $('body').text().trim().replace(/\s+/g, ' ');
  if (bodyText.length > 100) {
    return {
      text: bodyText.slice(0, 5000),
      title: $('h1, title').first().text().trim() || undefined,
      url: baseUrl,
      sourceSelector: 'body-fallback',
    };
  }

  return null;
}

/**
 * Extract structured data from municipal pages (schema.org, JSON-LD)
 */
export function extractStructuredData(html: string): Record<string, unknown>[] {
  const $ = cheerio.load(html);
  const results: Record<string, unknown>[] = [];

  // JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const data = JSON.parse(content);
        if (data['@type'] === 'Event' || data['@type'] === 'Course') {
          results.push(data);
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  });

  return results;
}
