// Favorites management using localStorage
const FAVORITES_KEY = 'agendaviva_favorites';

export interface Favorite {
  id: string;
  addedAt: string;
}

export function getFavorites(): Favorite[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isFavorite(activityId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(fav => fav.id === activityId);
}

export function addFavorite(activityId: string): void {
  const favorites = getFavorites();
  
  if (!isFavorite(activityId)) {
    favorites.push({
      id: activityId,
      addedAt: new Date().toISOString()
    });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('favorites-changed'));
  }
}

export function removeFavorite(activityId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter(fav => fav.id !== activityId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('favorites-changed'));
}

export function toggleFavorite(activityId: string): boolean {
  if (isFavorite(activityId)) {
    removeFavorite(activityId);
    return false;
  } else {
    addFavorite(activityId);
    return true;
  }
}
