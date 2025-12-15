<script lang="ts">
  import NDScore from './NDScore.svelte';

  export let activity: any;
</script>

<article class="card hover:shadow-md transition-shadow">
  <div class="flex justify-between items-start mb-2">
    <h3 class="font-semibold text-lg text-gray-900">{activity.nom}</h3>
    {#if activity.nd_score}
      <NDScore score={activity.nd_score} nivell={activity.nd_nivell} compact={true} />
    {/if}
  </div>
  
  <p class="text-sm text-gray-500 mb-3">
    {activity.subtipologia || activity.tipologia_principal} · {activity.municipi}
  </p>
  
  {#if activity.descripcio}
    <p class="text-gray-700 text-sm mb-3 line-clamp-2">{activity.descripcio}</p>
  {/if}
  
  <div class="flex flex-wrap gap-2 mb-3">
    {#if activity.tipologies && Array.isArray(activity.tipologies)}
      {#each activity.tipologies.slice(0, 3) as tip}
        <span class="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
          {tip.codi}
        </span>
      {/each}
    {/if}
  </div>
  
  <div class="flex gap-4 text-sm text-gray-600 mb-3">
    {#if activity.edat_text}
      <span>👶 {activity.edat_text}</span>
    {/if}
    {#if activity.dies}
      <span>📅 {activity.dies}</span>
    {/if}
    {#if activity.preu}
      <span>💰 {activity.preu}</span>
    {/if}
  </div>
  
  <div class="flex justify-between items-center">
    <a 
      href="/activitat/{activity.slug}" 
      class="text-primary-600 hover:text-primary-800 text-sm font-medium"
    >
      Veure detalls →
    </a>
    
    <button 
      class="text-gray-400 hover:text-red-500 transition-colors"
      aria-label="Afegir a favorits"
    >
      ♡
    </button>
  </div>
</article>
