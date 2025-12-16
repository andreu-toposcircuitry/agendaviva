import type { ExtractedBlock } from './generic.js';

/**
 * Instagram extractor (placeholder)
 *
 * Instagram scraping requires special handling:
 * - Official API with business account access
 * - Or third-party services like Apify, Phantombuster
 * - Direct scraping is against ToS and frequently blocked
 *
 * This placeholder provides the interface for future implementation.
 */
export interface InstagramPost {
  id: string;
  caption: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
}

export interface InstagramConfig {
  accessToken?: string;
  userId?: string;
}

/**
 * Extract activity information from Instagram posts
 *
 * Note: This is a placeholder. Real implementation would require:
 * - Facebook/Instagram Graph API access token
 * - Business or Creator account
 */
export async function extractFromInstagram(
  _accountHandle: string,
  _config: InstagramConfig = {}
): Promise<ExtractedBlock[]> {
  console.warn('Instagram extraction not yet implemented');
  console.warn('To implement, you need:');
  console.warn('1. Facebook Developer account');
  console.warn('2. Instagram Business/Creator account');
  console.warn('3. Graph API access token');

  return [];
}

/**
 * Parse activity information from Instagram caption text
 */
export function parseInstagramCaption(caption: string): {
  hasActivityInfo: boolean;
  extractedInfo: Record<string, string>;
} {
  const info: Record<string, string> = {};

  // Look for common patterns in Catalan/Spanish activity posts
  const patterns = {
    date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    time: /(\d{1,2}[:\.]?\d{0,2}\s*h)/i,
    price: /(\d+(?:[,\.]\d{2})?\s*€)/,
    age: /(\d+)\s*(?:a|anys|años)/i,
    inscription: /(inscripci[óo]n?|apunta't|inscriu)/i,
    link: /(link\s+(?:en\s+)?bio|enllaç\s+bio)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = caption.match(pattern);
    if (match) {
      info[key] = match[1] || match[0];
    }
  }

  const hasActivityInfo = Object.keys(info).length >= 2 ||
    patterns.inscription.test(caption);

  return { hasActivityInfo, extractedInfo: info };
}
