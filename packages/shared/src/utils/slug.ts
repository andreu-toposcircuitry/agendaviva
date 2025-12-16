/**
 * Generate a URL-friendly slug from text
 * Handles Catalan characters and special cases
 *
 * @example
 * generateSlug("L'Ametlla del Vallès") // "lametlla-del-valles"
 * generateSlug("Música i Dansa") // "musica-i-dansa"
 * generateSlug("Sant Celoni (Vallès)") // "sant-celoni-valles"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    // Normalize unicode characters
    .normalize('NFD')
    // Remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    // Replace middle dot (·) with hyphen
    .replace(/[·]/g, '-')
    // Remove apostrophes without adding space
    .replace(/['']/g, '')
    // Replace any non-alphanumeric (except hyphen) with hyphen
    .replace(/[^a-z0-9-]/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Generate a unique slug by appending a number if needed
 *
 * @example
 * generateUniqueSlug("music", ["music", "music-1"]) // "music-2"
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  const slug = generateSlug(baseSlug);

  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Check if a string is a valid slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
