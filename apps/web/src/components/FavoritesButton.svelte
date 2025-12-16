<script lang="ts">
  interface Props {
    activitatId: string;
  }

  let { activitatId }: Props = $props();

  let isFavorite = $state(false);

  function getFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('agendaviva_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveFavorites(favorites: string[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('agendaviva_favorites', JSON.stringify(favorites));
  }

  function toggleFavorite() {
    const favorites = getFavorites();
    if (isFavorite) {
      const index = favorites.indexOf(activitatId);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    } else {
      favorites.push(activitatId);
    }
    saveFavorites(favorites);
    isFavorite = !isFavorite;
  }

  $effect(() => {
    isFavorite = getFavorites().includes(activitatId);
  });
</script>

<button
  onclick={toggleFavorite}
  class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
  aria-label={isFavorite ? 'Eliminar dels preferits' : 'Afegir als preferits'}
  title={isFavorite ? 'Eliminar dels preferits' : 'Afegir als preferits'}
>
  {#if isFavorite}
    <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  {:else}
    <svg class="w-5 h-5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  {/if}
</button>
