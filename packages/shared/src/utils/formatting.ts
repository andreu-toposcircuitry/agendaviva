/**
 * Format age range for display
 *
 * @example
 * formatEdatRange(3, 12) // "3-12 anys"
 * formatEdatRange(6, 6) // "6 anys"
 * formatEdatRange(undefined, 10) // "Fins a 10 anys"
 * formatEdatRange(8, undefined) // "Des de 8 anys"
 * formatEdatRange() // "Totes les edats"
 */
export function formatEdatRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) {
    return 'Totes les edats';
  }

  if (min !== undefined && max !== undefined) {
    if (min === max) {
      return `${min} anys`;
    }
    return `${min}-${max} anys`;
  }

  if (min !== undefined) {
    return `Des de ${min} anys`;
  }

  return `Fins a ${max} anys`;
}

/**
 * Format price for display
 *
 * @example
 * formatPreu(150, 'trimestre') // "150€/trimestre"
 * formatPreu(0) // "Gratuït"
 * formatPreu(undefined) // "Consultar"
 */
export function formatPreu(
  amount?: number,
  periode?: 'sessio' | 'mes' | 'trimestre' | 'curs' | 'total'
): string {
  if (amount === undefined || amount === null) {
    return 'Consultar';
  }

  if (amount === 0) {
    return 'Gratuït';
  }

  const periodeLabels: Record<string, string> = {
    sessio: 'sessió',
    mes: 'mes',
    trimestre: 'trimestre',
    curs: 'curs',
    total: '',
  };

  const formattedAmount = amount.toLocaleString('ca-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (periode && periode !== 'total') {
    return `${formattedAmount}€/${periodeLabels[periode]}`;
  }

  return `${formattedAmount}€`;
}

/**
 * Format price range for display
 *
 * @example
 * formatPreuRange(100, 150, 'trimestre') // "100-150€/trimestre"
 * formatPreuRange(100, 100) // "100€"
 */
export function formatPreuRange(
  min?: number,
  max?: number,
  periode?: 'sessio' | 'mes' | 'trimestre' | 'curs' | 'total'
): string {
  if (min === undefined && max === undefined) {
    return 'Consultar';
  }

  if (min === 0 && (max === undefined || max === 0)) {
    return 'Gratuït';
  }

  const periodeLabels: Record<string, string> = {
    sessio: 'sessió',
    mes: 'mes',
    trimestre: 'trimestre',
    curs: 'curs',
    total: '',
  };

  const periodeSuffix = periode && periode !== 'total' ? `/${periodeLabels[periode]}` : '';

  if (min !== undefined && max !== undefined && min !== max) {
    return `${min}-${max}€${periodeSuffix}`;
  }

  const amount = min ?? max;
  return `${amount}€${periodeSuffix}`;
}

/**
 * Format date in Catalan locale
 *
 * @example
 * formatDate("2024-09-15") // "15 de setembre de 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date range
 *
 * @example
 * formatDateRange("2024-09-01", "2024-06-30") // "1 set. 2024 - 30 juny 2025"
 */
export function formatDateRange(startStr?: string, endStr?: string): string {
  if (!startStr && !endStr) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (startStr && endStr) {
    const start = new Date(startStr).toLocaleDateString('ca-ES', options);
    const end = new Date(endStr).toLocaleDateString('ca-ES', options);
    return `${start} - ${end}`;
  }

  if (startStr) {
    return `Des de ${new Date(startStr).toLocaleDateString('ca-ES', options)}`;
  }

  return `Fins a ${new Date(endStr!).toLocaleDateString('ca-ES', options)}`;
}

/**
 * Truncate text with ellipsis
 *
 * @example
 * truncateText("Lorem ipsum dolor sit amet", 20) // "Lorem ipsum dolor..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength to avoid cutting words
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Capitalize first letter
 *
 * @example
 * capitalizeFirst("música") // "Música"
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
