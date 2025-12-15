import { MUNICIPIS, TIPOLOGIES } from './constants.js';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[·]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidMunicipi(municipi: string): boolean {
  return MUNICIPIS.some(m => m.id === municipi || m.nom === municipi);
}

export function isValidTipologia(tipologia: string): boolean {
  return tipologia in TIPOLOGIES;
}

export function isValidEdatRange(min?: number, max?: number): boolean {
  if (min !== undefined && max !== undefined) {
    return min >= 0 && max <= 18 && min <= max;
  }
  if (min !== undefined) {
    return min >= 0 && min <= 18;
  }
  if (max !== undefined) {
    return max >= 0 && max <= 18;
  }
  return true;
}

export function isValidNDScore(score?: number): boolean {
  if (score === undefined) return true;
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

export function parseEdatText(text: string): { min?: number; max?: number } {
  // Examples: "6-12 anys", "De 3 a 8 anys", "A partir de 10 anys", "Fins a 14 anys"
  const result: { min?: number; max?: number } = {};
  
  // Pattern: "6-12", "6 a 12", "6-12 anys"
  const rangeMatch = text.match(/(\d+)\s*[-a]\s*(\d+)/);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1]);
    result.max = parseInt(rangeMatch[2]);
    return result;
  }
  
  // Pattern: "A partir de X"
  const fromMatch = text.match(/a partir de\s*(\d+)/i);
  if (fromMatch) {
    result.min = parseInt(fromMatch[1]);
    return result;
  }
  
  // Pattern: "Fins a X"
  const toMatch = text.match(/fins a\s*(\d+)/i);
  if (toMatch) {
    result.max = parseInt(toMatch[1]);
    return result;
  }
  
  // Single number
  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const age = parseInt(singleMatch[1]);
    result.min = age;
    result.max = age;
    return result;
  }
  
  return result;
}

export function formatPreu(preu: string | undefined): string {
  if (!preu) return 'Consultar';
  if (preu.toLowerCase().includes('gratis') || preu.toLowerCase().includes('gratuït')) {
    return 'Gratuït';
  }
  return preu;
}

export function normalizeMunicipi(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  const found = MUNICIPIS.find(m => 
    m.id === normalized || 
    m.nom.toLowerCase() === normalized ||
    m.codi_postal.some(cp => text.includes(cp))
  );
  return found ? found.id : null;
}
