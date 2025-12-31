/**
 * Format a date as a localized string
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a datetime as a localized string
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'ara mateix';
  if (diffMins < 60) return `fa ${diffMins} minut${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `fa ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `fa ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  return formatDate(d);
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get badge color for estat
 */
export function getEstatColor(estat: string): string {
  const colors: Record<string, string> = {
    publicada: 'bg-green-100 text-green-800',
    pendent: 'bg-yellow-100 text-yellow-800',
    esborrany: 'bg-gray-100 text-gray-800',
    arxivada: 'bg-blue-100 text-blue-800',
    rebutjada: 'bg-red-100 text-red-800'
  };
  return colors[estat] || 'bg-gray-100 text-gray-800';
}

/**
 * Get badge color for priority
 */
export function getPriorityColor(prioritat: string): string {
  const colors: Record<string, string> = {
    alta: 'bg-red-100 text-red-800',
    mitjana: 'bg-amber-100 text-amber-800',
    baixa: 'bg-gray-100 text-gray-800'
  };
  return colors[prioritat] || 'bg-gray-100 text-gray-800';
}

/**
 * Get text color for confidence score
 */
export function getConfidenceColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-500';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get text color for ND score
 */
export function getNDScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-500';
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-orange-600';
}
