<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import { MUNICIPI_IDS, TIPOLOGIA_CODIS } from '@agendaviva/shared';
  import type { Activitat } from '@agendaviva/shared';

  const tipologies = TIPOLOGIA_CODIS;
  const municipiIds = MUNICIPI_IDS;

  let activity: Activitat | null = null;
  let loading = true;
  let isSaving = false;
  let saveSuccess = false;
  let error: string | null = null;

  // Form state
  let nom = '';
  let descripcio = '';
  let tipologiaPrincipal = '';
  let municipiId = '';
  let ndScore: number | undefined;

  onMount(async () => {
    const { data, error: fetchError } = await supabase
      .from('activitats')
      .select('*')
      .eq('id', $page.params.id)
      .single();

    if (fetchError) {
      error = fetchError.message;
    } else if (data) {
      activity = data as Activitat;
      nom = activity.nom;
      descripcio = activity.descripcio || '';
      tipologiaPrincipal = activity.tipologia_principal;
      municipiId = activity.municipi_id || '';
      ndScore = activity.nd_score || undefined;
    }
    loading = false;
  });

  async function handleSave() {
    isSaving = true;
    error = null;
    saveSuccess = false;

    if (!activity) {
      error = "No s'ha trobat l'activitat per actualitzar.";
      isSaving = false;
      return;
    }

    const updatePayload = {
      nom,
      descripcio: descripcio || null,
      tipologia_principal: tipologiaPrincipal,
      municipi_id: municipiId || null,
      nd_score: ndScore || null,
      slug: nom !== activity.nom ? undefined : activity.slug
    };

    const { error: updateError } = await supabase
      .from('activitats')
      .update(updatePayload)
      .eq('id', activity.id);

    if (updateError) {
      error = updateError.message;
    } else {
      saveSuccess = true;
    }

    isSaving = false;
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">
    {#if activity}
      Edita: {activity.nom}
    {:else}
      Carregant activitat...
    {/if}
  </h1>

  {#if loading}
    <p>Carregant dades...</p>
  {:else if error}
    <p class="text-red-600">Error: {error}</p>
  {:else if activity}
    <form on:submit|preventDefault={handleSave} class="space-y-6 bg-white p-6 rounded-lg shadow">
      <div class="text-sm text-gray-500 border-b pb-4">
        ID: {activity.id} | Estat: <span class="font-medium capitalize">{activity.estat}</span>
      </div>

      <div>
        <label for="nom" class="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'activitat *
        </label>
        <input
          type="text"
          id="nom"
          bind:value={nom}
          required
          class="input"
        />
      </div>

      <div>
        <label for="descripcio" class="block text-sm font-medium text-gray-700 mb-1">
          Descripció
        </label>
        <textarea
          id="descripcio"
          bind:value={descripcio}
          rows="4"
          class="input"
        ></textarea>
      </div>

      <div>
        <label for="tipologia" class="block text-sm font-medium text-gray-700 mb-1">
          Tipologia Principal *
        </label>
        <select id="tipologia" bind:value={tipologiaPrincipal} required class="input">
          {#each tipologies as tipologia}
            <option value={tipologia}>{tipologia}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="municipi" class="block text-sm font-medium text-gray-700 mb-1">
          Municipi ID
        </label>
        <select id="municipi" bind:value={municipiId} class="input">
          <option value="">(Cap / Sense especificar)</option>
          {#each municipiIds as id}
            <option value={id}>{id}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="ndScore" class="block text-sm font-medium text-gray-700 mb-1">
          ND Score (1-5)
        </label>
        <input
          type="number"
          id="ndScore"
          bind:value={ndScore}
          min="1"
          max="5"
          step="1"
          class="input"
        />
      </div>

      <div class="flex items-center gap-4 pt-4">
        <button
          type="submit"
          class="btn btn-primary"
          disabled={isSaving}
        >
          {#if isSaving}
            Guardant...
          {:else}
            Guardar
          {/if}
        </button>

        {#if saveSuccess}
          <span class="text-sm text-green-600">Guardat correctament!</span>
        {/if}
      </div>
    </form>
  {:else}
    <p>No s'ha trobat l'activitat.</p>
  {/if}
</div>
