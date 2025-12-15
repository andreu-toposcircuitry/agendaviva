export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ca-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
