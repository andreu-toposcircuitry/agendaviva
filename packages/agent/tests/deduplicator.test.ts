import { describe, it, expect } from 'vitest';
import { checkDuplicate, findPotentialDuplicates } from '../src/deduplicator.js';

describe('checkDuplicate', () => {
  it('should detect exact slug match', () => {
    const result = checkDuplicate(
      { nom: 'Escola de Musica' },
      ['escola-de-musica', 'curs-de-dansa', 'taller-de-teatre']
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedSlug).toBe('escola-de-musica');
    expect(result.similarity).toBe(1.0);
  });

  it('should detect slug with municipality suffix', () => {
    const result = checkDuplicate(
      { nom: 'Escola de Musica', municipiId: 'granollers' },
      ['escola-de-musica-granollers', 'curs-de-dansa']
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedSlug).toBe('escola-de-musica-granollers');
    expect(result.similarity).toBe(0.95);
  });

  it('should detect slug with municipality prefix', () => {
    const result = checkDuplicate(
      { nom: 'Escola de Musica', municipiId: 'mollet' },
      ['mollet-escola-de-musica', 'curs-de-dansa']
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedSlug).toBe('mollet-escola-de-musica');
    expect(result.similarity).toBe(0.95);
  });

  it('should detect fuzzy match above threshold', () => {
    // "escola-de-musica" vs "escola-de-music" differs by 1 char (similarity ~0.94)
    const result = checkDuplicate(
      { nom: 'Escola de Musica' },
      ['escola-de-music', 'curs-de-dansa']
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedSlug).toBe('escola-de-music');
    expect(result.similarity).toBeGreaterThan(0.85);
  });

  it('should not match dissimilar slugs', () => {
    const result = checkDuplicate(
      { nom: 'Escola de Musica' },
      ['curs-de-natacio', 'taller-de-teatre', 'casal-destiu']
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.matchedSlug).toBeUndefined();
  });

  it('should handle empty existing slugs', () => {
    const result = checkDuplicate({ nom: 'Escola de Musica' }, []);

    expect(result.isDuplicate).toBe(false);
  });

  it('should handle Catalan special characters', () => {
    const result = checkDuplicate(
      { nom: "L'Ametlla Cultural" },
      ['lametlla-cultural', 'sant-celoni-cultural']
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.matchedSlug).toBe('lametlla-cultural');
  });
});

describe('findPotentialDuplicates', () => {
  const existingActivities = [
    { slug: 'escola-de-musica', nom: 'Escola de Musica', municipiId: 'granollers' },
    { slug: 'escola-de-dansa', nom: 'Escola de Dansa', municipiId: 'granollers' },
    { slug: 'escola-de-musica-mollet', nom: 'Escola de Musica de Mollet', municipiId: 'mollet' },
    { slug: 'casal-destiu', nom: "Casal d'Estiu", municipiId: 'cardedeu' },
  ];

  it('should find duplicates in same municipality with lower threshold', () => {
    const results = findPotentialDuplicates(
      { nom: 'Escola Musica', municipiId: 'granollers' },
      existingActivities
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('escola-de-musica');
    expect(results[0].similarity).toBeGreaterThan(0.7);
  });

  it('should require higher similarity for different municipality', () => {
    const results = findPotentialDuplicates(
      { nom: 'Escola de Musica', municipiId: 'cardedeu' },
      existingActivities
    );

    // Should find matches in other municipalities but with higher similarity requirement
    const granollersMatch = results.find((r) => r.slug === 'escola-de-musica');
    expect(granollersMatch).toBeDefined();
    expect(granollersMatch?.similarity).toBeGreaterThan(0.85);
  });

  it('should sort results by similarity descending', () => {
    const results = findPotentialDuplicates({ nom: 'Escola de Musica' }, existingActivities);

    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
    }
  });

  it('should return empty array when no matches found', () => {
    const results = findPotentialDuplicates(
      { nom: 'Taller de Robotica', municipiId: 'granollers' },
      existingActivities
    );

    expect(results).toHaveLength(0);
  });
});
