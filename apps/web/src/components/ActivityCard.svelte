<script lang="ts">
  import NDScore from './NDScore.svelte';
  import FavoritesButton from './FavoritesButton.svelte';

  interface Activity {
    id: string;
    nom: string;
    slug: string;
    tipologia_principal: string;
    municipi_nom?: string;
    edat_text?: string;
    dies?: string;
    preu?: string;
    nd_score?: number;
    nd_nivell?: string;
    descripcio?: string;
  }

  interface Props {
    activity: Activity;
    showFavorite?: boolean;
  }

  let { activity, showFavorite = true }: Props = $props();
</script>

<article class="card group relative">
  {#if showFavorite}
    <div class="absolute top-3 right-3">
      <FavoritesButton activitatId={activity.id} />
    </div>
  {/if}

  <h3 class="font-semibold text-lg pr-8">{activity.nom}</h3>
  <p class="text-sm text-gray-500 mt-1">
    {activity.tipologia_principal}
    {#if activity.municipi_nom}
      <span class="mx-1">·</span>
      {activity.municipi_nom}
    {/if}
  </p>

  {#if activity.descripcio}
    <p class="text-sm text-gray-600 mt-2 line-clamp-2">
      {activity.descripcio}
    </p>
  {/if}

  {#if activity.nd_score}
    <div class="mt-3">
      <NDScore score={activity.nd_score} nivell={activity.nd_nivell} compact />
    </div>
  {/if}

  <div class="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
    {#if activity.edat_text}
      <span class="flex items-center gap-1">
        <span aria-hidden="true">@</span>
        {activity.edat_text}
      </span>
    {/if}
    {#if activity.dies}
      <span class="flex items-center gap-1">
        <span aria-hidden="true">#</span>
        {activity.dies}
      </span>
    {/if}
    {#if activity.preu}
      <span class="flex items-center gap-1">
        <span aria-hidden="true">$</span>
        {activity.preu}
      </span>
    {/if}
  </div>

  <a
    href="/activitat/{activity.slug}"
    class="mt-4 block text-right text-green-600 hover:text-green-800 text-sm font-medium group-hover:underline"
  >
    Veure detalls &rarr;
  </a>
</article>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
