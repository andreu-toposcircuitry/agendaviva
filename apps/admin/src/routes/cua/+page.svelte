<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  type QueueItem = {
    id: string;
    activitat_nom: string;
    prioritat: string;
    motiu: string;
  };

  let queue: QueueItem[] = [];
  let loading = true;

  onMount(async () => {
    const { data } = await supabase
      .from('cua_revisio_detall')
      .select('*')
      .order('prioritat')
      .order('created_at');

    queue = data || [];
    loading = false;
  });

  function getPriorityColor(p: string) {
    return {
      alta: 'bg-red-100 text-red-800',
      mitjana: 'bg-amber-100 text-amber-800',
      baixa: 'bg-gray-100'
    }[p];
  }
</script>

<div class="flex justify-between items-center mb-6">
  <h1 class="text-2xl font-bold">Cua de Revisió</h1>
  <span class="text-gray-500">{queue.length} pendents</span>
</div>

{#if loading}
  <p>Carregant...</p>
{:else if queue.length === 0}
  <div class="text-center py-12 text-gray-500">
    🎉 No hi ha res pendent de revisar!
  </div>
{:else}
  <div class="space-y-4">
    {#each queue as item}
      <div class="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <span class="px-2 py-1 rounded text-xs {getPriorityColor(item.prioritat)}">
            {item.prioritat}
          </span>
          <h3 class="font-medium mt-1">{item.activitat_nom}</h3>
          <p class="text-sm text-gray-500">{item.motiu}</p>
        </div>
        <div class="flex gap-2">
          <a href={`/cua/${item.id}`} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Revisar
          </a>
        </div>
      </div>
    {/each}
  </div>
{/if}
