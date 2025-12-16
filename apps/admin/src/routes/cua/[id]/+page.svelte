<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let item: any = null;
  let activity: any = null;
  let loading = true;

  onMount(async () => {
    const { data: queueItem } = await supabase
      .from('cua_revisio')
      .select('*, activitats(*)')
      .eq('id', $page.params.id)
      .single();

    if (queueItem) {
      item = queueItem;
      activity = queueItem.activitats;
    }
    loading = false;
  });

  async function approve() {
    await supabase.from('activitats').update({ estat: 'publicada' }).eq('id', activity.id);
    await supabase
      .from('cua_revisio')
      .update({
        resolt_at: new Date().toISOString(),
        resolucio: 'aprovat'
      })
      .eq('id', item.id);
    goto('/cua');
  }

  async function reject() {
    await supabase.from('activitats').update({ estat: 'rebutjada' }).eq('id', activity.id);
    await supabase
      .from('cua_revisio')
      .update({
        resolt_at: new Date().toISOString(),
        resolucio: 'rebutjat'
      })
      .eq('id', item.id);
    goto('/cua');
  }
</script>

{#if loading}
  <p>Carregant...</p>
{:else if !item}
  <p>No trobat</p>
{:else}
  <div class="max-w-4xl">
    <h1 class="text-2xl font-bold mb-2">{activity.nom}</h1>
    <p class="text-gray-500 mb-6">Motiu de revisió: {item.motiu}</p>

    <div class="grid md:grid-cols-2 gap-8">
      <div class="bg-gray-50 p-4 rounded">
        <h2 class="font-semibold mb-2">Text original</h2>
        <pre class="text-sm whitespace-pre-wrap">{activity.font_text}</pre>
      </div>

      <div class="bg-white p-4 rounded border">
        <h2 class="font-semibold mb-4">Dades extretes</h2>
        <dl class="space-y-2 text-sm">
          <dt class="text-gray-500">Tipologia</dt>
          <dd>{activity.tipologia_principal}</dd>

          <dt class="text-gray-500">ND Score</dt>
          <dd>{activity.nd_score}/5 - {activity.nd_justificacio}</dd>

          <dt class="text-gray-500">Municipi</dt>
          <dd>{activity.municipi_id}</dd>

          <dt class="text-gray-500">Confiança</dt>
          <dd>{activity.confianca_global}%</dd>
        </dl>
      </div>
    </div>

    <div class="flex gap-4 mt-8">
      <button on:click={approve} class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        ✓ Aprovar
      </button>
      <a href={`/activitats/${activity.id}`} class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        ✏️ Editar
      </a>
      <button on:click={reject} class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        ✗ Rebutjar
      </button>
    </div>
  </div>
{/if}
