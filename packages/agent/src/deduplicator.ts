import { generateSlug } from '@agendaviva/shared';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedSlug?: string;
  similarity?: number;
}

export interface ActivityIdentifier {
  nom: string;
  municipiId?: string;
  entitatNom?: string;
}

/**
 * Simple duplicate detection based on slug similarity
 * For production, consider using embeddings or fuzzy matching
 */
export function checkDuplicate(
  newActivity: ActivityIdentifier,
  existingSlugs: string[]
): DuplicateCheckResult {
  const newSlug = generateSlug(newActivity.nom);

  // Exact match
  if (existingSlugs.includes(newSlug)) {
    return { isDuplicate: true, matchedSlug: newSlug, similarity: 1.0 };
  }

  // Check with municipality prefix
  if (newActivity.municipiId) {
    const slugWithMunicipi = `${newSlug}-${newActivity.municipiId}`;
    if (existingSlugs.includes(slugWithMunicipi)) {
      return { isDuplicate: true, matchedSlug: slugWithMunicipi, similarity: 0.95 };
    }

    // Also check reversed format
    const reversedSlug = `${newActivity.municipiId}-${newSlug}`;
    if (existingSlugs.includes(reversedSlug)) {
      return { isDuplicate: true, matchedSlug: reversedSlug, similarity: 0.95 };
    }
  }

  // Fuzzy match using Levenshtein distance
  for (const existing of existingSlugs) {
    const similarity = calculateSimilarity(newSlug, existing);
    if (similarity > 0.85) {
      return { isDuplicate: true, matchedSlug: existing, similarity };
    }
  }

  return { isDuplicate: false };
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  const longerLength = longer.length;
  const editDistance = levenshtein(longer, shorter);

  return (longerLength - editDistance) / longerLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if an activity might be a duplicate based on name and location
 */
export function findPotentialDuplicates(
  newActivity: ActivityIdentifier,
  existingActivities: Array<{ slug: string; nom: string; municipiId?: string }>
): Array<{ slug: string; nom: string; similarity: number }> {
  const newSlug = generateSlug(newActivity.nom);
  const potentialDuplicates: Array<{ slug: string; nom: string; similarity: number }> = [];

  for (const existing of existingActivities) {
    // If same municipality, be more strict
    if (newActivity.municipiId && existing.municipiId === newActivity.municipiId) {
      const similarity = calculateSimilarity(newSlug, existing.slug);
      if (similarity > 0.7) {
        potentialDuplicates.push({ slug: existing.slug, nom: existing.nom, similarity });
      }
    } else {
      // Different or unknown municipality, require higher similarity
      const similarity = calculateSimilarity(newSlug, existing.slug);
      if (similarity > 0.85) {
        potentialDuplicates.push({ slug: existing.slug, nom: existing.nom, similarity });
      }
    }
  }

  // Sort by similarity descending
  return potentialDuplicates.sort((a, b) => b.similarity - a.similarity);
}
