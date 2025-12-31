<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { debounce } from '$lib/utils/debounce';
  import { formatDateTime, getEstatColor, getConfidenceColor, getNDScoreColor, truncate } from '$lib/utils/format';
  import { toast } from '$lib/stores/toast';
  import { TIPOLOGIA_CODIS, MUNICIPIS } from '@agendaviva/shared';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  
  interface Activity {
    id: string;
    nom: string;
    municipi_id: string | null;
    municipi_nom: string | null;
    tipologia_principal: string;
    estat: string;
    confianca_global: number | null;
    nd_nivell: string | null;
    nd_score: number | null;
    needs_review: boolean;
    created_at: string;
    updated_at: string;
  }
  
  let activities: Activity[] = [];
  let loading = true;
  let error: string | null = null;
  let retryCount = 0;
  let totalCount = 0;
  let currentPage = 1;
  let pageSize = 20;
  
  // Filters
  let searchQuery = '';
  let selectedMunicipi = '';
  let selectedTipologia = '';
  let selectedEstat = '';
  let selectedNeedsReview = '';
  let confiancaMin = '';
  let confiancaMax = '';
  let ndScoreMin = '';
  let ndScoreMax = '';
  
  // Sorting
  let sortBy = 'updated_at';
  let sortOrder: 'asc' | 'desc' = 'desc';
  
  // UI state
  let showFilters = false;
  let selectedActivities: Set<string> = new Set();
  let showBulkDialog = false;
  let bulkOperation = '';
  let bulkLoading = false;
  
  const estatOptions = ['publicada', 'pendent', 'esborrany', 'arxivada', 'rebutjada'];
  
  onMount(() => {
    loadActivities();
  });
  
  async function loadActivities() {
    loading = true;
    error = null;
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        order: sortOrder
      });
      
      if (searchQuery) params.set('q', searchQuery);
      if (selectedMunicipi) params.set('municipi_id', selectedMunicipi);
      if (selectedTipologia) params.set('tipologia_principal', selectedTipologia);
      if (selectedEstat) params.set('estat', selectedEstat);
      if (selectedNeedsReview) params.set('needs_review', selectedNeedsReview);
      if (confiancaMin) params.set('confianca_min', confiancaMin);
      if (confiancaMax) params.set('confianca_max', confiancaMax);
      if (ndScoreMin) params.set('nd_score_min', ndScoreMin);
      if (ndScoreMax) params.set('nd_score_max', ndScoreMax);
      
      const response = await fetch(`/api/activitats?${params}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use the default error message
        }
        
        if (response.status === 401) {
          error = 'No autenticat. Si us plau, torna a iniciar sessió.';
        } else if (response.status === 403) {
          error = 'No tens permisos per accedir a aquesta pàgina. Necessites rol d\'admin o moderador.';
        } else if (response.status === 404) {
          error = 'L\'endpoint de l\'API no s\'ha trobat. Verifica la configuració del servidor.';
        } else if (response.status >= 500) {
          error = `Error del servidor: ${errorMessage}. Comprova els logs del servidor.`;
        } else {
          error = `Error: ${errorMessage}`;
        }
        
        throw new Error(error);
      }
      
      const data = await response.json();
      activities = data.activities;
      totalCount = data.totalCount;
      retryCount = 0; // Reset retry count on success
    } catch (err: any) {
      console.error('Error loading activities:', err);
      
      // Handle network errors specifically
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        error = 'Error de xarxa: No es pot connectar amb el servidor. Verifica que el servidor està actiu i les variables d\'entorn estan configurades correctament.';
      } else {
        error = err.message || 'Error desconegut carregant activitats';
      }
      
      toast.error(error);
    } finally {
      loading = false;
    }
  }
  
  const debouncedSearch = debounce(() => {
    currentPage = 1;
    loadActivities();
  }, 500);
  
  function handleSearch() {
    debouncedSearch();
  }
  
  function handleFilter() {
    currentPage = 1;
    loadActivities();
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedMunicipi = '';
    selectedTipologia = '';
    selectedEstat = '';
    selectedNeedsReview = '';
    confiancaMin = '';
    confiancaMax = '';
    ndScoreMin = '';
    ndScoreMax = '';
    currentPage = 1;
    loadActivities();
  }
  
  function handleSort(column: string) {
    if (sortBy === column) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortOrder = 'desc';
    }
    loadActivities();
  }
  
  function handlePageChange(newPage: number) {
    currentPage = newPage;
    loadActivities();
  }
  
  function handlePageSizeChange(newSize: number) {
    pageSize = newSize;
    currentPage = 1;
    loadActivities();
  }
  
  function toggleSelectActivity(id: string) {
    if (selectedActivities.has(id)) {
      selectedActivities.delete(id);
    } else {
      selectedActivities.add(id);
    }
    selectedActivities = selectedActivities;
  }
  
  function toggleSelectAll() {
    if (selectedActivities.size === activities.length) {
      selectedActivities.clear();
    } else {
      activities.forEach(a => selectedActivities.add(a.id));
    }
    selectedActivities = selectedActivities;
  }
  
  async function quickPublish(id: string, currentEstat: string) {
    try {
      const action = currentEstat === 'publicada' ? 'unpublish' : 'publish';
      const response = await fetch(`/api/activitats/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update');
      }
      
      toast.success(action === 'publish' ? 'Activitat publicada' : 'Activitat despublicada');
      loadActivities();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  function openBulkDialog(operation: string) {
    if (selectedActivities.size === 0) {
      toast.warning('Selecciona almenys una activitat');
      return;
    }
    bulkOperation = operation;
    showBulkDialog = true;
  }
  
  async function executeBulkOperation() {
    bulkLoading = true;
    try {
      const response = await fetch('/api/activitats/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: bulkOperation,
          activityIds: Array.from(selectedActivities)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute bulk operation');
      }
      
      const data = await response.json();
      toast.success(`Operació completada: ${data.count} activitats actualitzades`);
      selectedActivities.clear();
      selectedActivities = selectedActivities;
      showBulkDialog = false;
      loadActivities();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      bulkLoading = false;
    }
  }
  
  function getBulkOperationText(operation: string): string {
    const texts: Record<string, string> = {
      bulk_publish: 'Publicar seleccionades',
      bulk_unpublish: 'Despublicar seleccionades',
      bulk_mark_reviewed: 'Marcar com revisades',
      bulk_queue_remove: 'Treure de la cua'
    };
    return texts[operation] || operation;
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Activitats</h1>
    <div class="flex gap-2">
      {#if selectedActivities.size > 0}
        <button on:click={() => openBulkDialog('bulk_publish')} class="btn btn-success text-sm">
          Publicar ({selectedActivities.size})
        </button>
        <button on:click={() => openBulkDialog('bulk_mark_reviewed')} class="btn btn-secondary text-sm">
          Marcar revisades ({selectedActivities.size})
        </button>
      {/if}
      <button on:click={() => showFilters = !showFilters} class="btn btn-secondary">
        {showFilters ? 'Amagar' : 'Mostrar'} Filtres
      </button>
    </div>
  </div>
  
  <!-- Search -->
  <div class="card">
    <input
      type="search"
      bind:value={searchQuery}
      on:input={handleSearch}
      placeholder="Cerca per nom, descripció, espai o tags..."
      class="input"
      aria-label="Cercar activitats"
    />
  </div>
  
  <!-- Filters -->
  {#if showFilters}
    <div class="card space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="municipi-filter" class="block text-sm font-medium mb-1">Municipi</label>
          <select id="municipi-filter" bind:value={selectedMunicipi} on:change={handleFilter} class="input">
            <option value="">Tots</option>
            {#each MUNICIPIS as municipi}
              <option value={municipi.id}>{municipi.nom}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="tipologia-filter" class="block text-sm font-medium mb-1">Tipologia</label>
          <select id="tipologia-filter" bind:value={selectedTipologia} on:change={handleFilter} class="input">
            <option value="">Totes</option>
            {#each TIPOLOGIA_CODIS as tipologia}
              <option value={tipologia}>{tipologia}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="estat-filter" class="block text-sm font-medium mb-1">Estat</label>
          <select id="estat-filter" bind:value={selectedEstat} on:change={handleFilter} class="input">
            <option value="">Tots</option>
            {#each estatOptions as estat}
              <option value={estat}>{estat}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label for="needs-review-filter" class="block text-sm font-medium mb-1">Necessita revisió</label>
          <select id="needs-review-filter" bind:value={selectedNeedsReview} on:change={handleFilter} class="input">
            <option value="">Tots</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Confiança global</label>
          <div class="flex gap-2">
            <input type="number" bind:value={confiancaMin} on:change={handleFilter} placeholder="Min" class="input" min="0" max="100" />
            <input type="number" bind:value={confiancaMax} on:change={handleFilter} placeholder="Max" class="input" min="0" max="100" />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">ND Score</label>
          <div class="flex gap-2">
            <input type="number" bind:value={ndScoreMin} on:change={handleFilter} placeholder="Min" class="input" min="1" max="5" />
            <input type="number" bind:value={ndScoreMax} on:change={handleFilter} placeholder="Max" class="input" min="1" max="5" />
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button on:click={clearFilters} class="btn btn-secondary text-sm">
          Esborrar filtres
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Results -->
  <div class="card">
    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin text-4xl">⟳</div>
        <p class="mt-2 text-gray-500">Carregant...</p>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-600 text-4xl mb-4">⚠️</div>
        <p class="text-red-600 text-lg font-semibold mb-2">Error carregant activitats</p>
        <p class="text-gray-600 mb-4 max-w-2xl mx-auto">{error}</p>
        <div class="flex gap-2 justify-center">
          <button on:click={loadActivities} class="btn btn-primary">
            Tornar a intentar
          </button>
          <a href="/api/health" target="_blank" class="btn btn-secondary">
            Comprovar estat del servidor
          </a>
        </div>
        <details class="mt-6 text-left max-w-2xl mx-auto">
          <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Consells per solucionar problemes
          </summary>
          <div class="mt-4 text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded">
            <p><strong>Si l'error és d'autenticació:</strong></p>
            <ul class="list-disc list-inside ml-4">
              <li>Assegura't que has iniciat sessió</li>
              <li>Verifica que el teu compte té permisos d'admin o moderador</li>
              <li>Prova a tancar sessió i tornar a iniciar-la</li>
            </ul>
            <p><strong>Si l'error és de xarxa:</strong></p>
            <ul class="list-disc list-inside ml-4">
              <li>Comprova que les variables d'entorn PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_ANON_KEY estan configurades</li>
              <li>Verifica que el servidor està actiu executant <code class="bg-gray-200 px-1 rounded">pnpm dev</code></li>
              <li>Comprova la consola del navegador per més detalls</li>
            </ul>
            <p><strong>Si l'error és del servidor (500):</strong></p>
            <ul class="list-disc list-inside ml-4">
              <li>Revisa els logs del servidor</li>
              <li>Verifica la connexió a la base de dades</li>
              <li>Comprova que les migracions de BD estan aplicades</li>
            </ul>
          </div>
        </details>
      </div>
    {:else if activities.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">No s'han trobat activitats</p>
        {#if searchQuery || selectedMunicipi || selectedTipologia || selectedEstat}
          <button on:click={clearFilters} class="mt-4 btn btn-secondary">
            Esborrar filtres
          </button>
        {/if}
      </div>
    {:else}
      <!-- Desktop table -->
      <div class="hidden md:block table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th class="w-12">
                <input
                  type="checkbox"
                  checked={selectedActivities.size === activities.length && activities.length > 0}
                  on:change={toggleSelectAll}
                  aria-label="Seleccionar totes"
                />
              </th>
              <th class="cursor-pointer" on:click={() => handleSort('nom')}>
                Nom {sortBy === 'nom' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Municipi</th>
              <th>Tipologia</th>
              <th class="cursor-pointer" on:click={() => handleSort('estat')}>
                Estat {sortBy === 'estat' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th class="cursor-pointer" on:click={() => handleSort('confianca_global')}>
                Conf. {sortBy === 'confianca_global' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th class="cursor-pointer" on:click={() => handleSort('nd_score')}>
                ND {sortBy === 'nd_score' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Rev.</th>
              <th class="cursor-pointer" on:click={() => handleSort('updated_at')}>
                Actualitzat {sortBy === 'updated_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Accions</th>
            </tr>
          </thead>
          <tbody>
            {#each activities as activity}
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedActivities.has(activity.id)}
                    on:change={() => toggleSelectActivity(activity.id)}
                    aria-label="Seleccionar {activity.nom}"
                  />
                </td>
                <td>
                  <a href="/activitats/{activity.id}" class="text-blue-600 hover:underline font-medium">
                    {truncate(activity.nom, 50)}
                  </a>
                </td>
                <td class="text-sm text-gray-600">{activity.municipi_nom || '-'}</td>
                <td class="text-sm">{activity.tipologia_principal}</td>
                <td>
                  <span class="badge {getEstatColor(activity.estat)}">
                    {activity.estat}
                  </span>
                </td>
                <td class="{getConfidenceColor(activity.confianca_global)} font-medium">
                  {activity.confianca_global ?? '-'}
                </td>
                <td class="{getNDScoreColor(activity.nd_score)} font-medium">
                  {activity.nd_score ?? '-'}
                </td>
                <td>
                  {#if activity.needs_review}
                    <span class="text-red-600" title="Necessita revisió">⚠</span>
                  {:else}
                    <span class="text-gray-300">-</span>
                  {/if}
                </td>
                <td class="text-xs text-gray-500">
                  {formatDateTime(activity.updated_at)}
                </td>
                <td>
                  <div class="flex gap-1">
                    <button
                      on:click={() => quickPublish(activity.id, activity.estat)}
                      class="text-xs px-2 py-1 rounded {activity.estat === 'publicada' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'}"
                      title={activity.estat === 'publicada' ? 'Despublicar' : 'Publicar'}
                    >
                      {activity.estat === 'publicada' ? '👁️' : '✓'}
                    </button>
                    <a
                      href="/activitats/{activity.id}"
                      class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      title="Editar"
                    >
                      ✏️
                    </a>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Mobile cards -->
      <div class="md:hidden space-y-4">
        {#each activities as activity}
          <div class="border rounded-lg p-4">
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedActivities.has(activity.id)}
                on:change={() => toggleSelectActivity(activity.id)}
                class="mt-1"
                aria-label="Seleccionar {activity.nom}"
              />
              <div class="flex-1 min-w-0">
                <a href="/activitats/{activity.id}" class="text-blue-600 hover:underline font-medium block mb-2">
                  {activity.nom}
                </a>
                <div class="space-y-1 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="badge {getEstatColor(activity.estat)}">{activity.estat}</span>
                    {#if activity.needs_review}
                      <span class="text-red-600" title="Necessita revisió">⚠ Revisió</span>
                    {/if}
                  </div>
                  <div class="text-gray-600">
                    {activity.municipi_nom || 'Sense municipi'} • {activity.tipologia_principal}
                  </div>
                  <div class="flex gap-4 text-gray-500">
                    <span class="{getConfidenceColor(activity.confianca_global)}">
                      Conf: {activity.confianca_global ?? '-'}
                    </span>
                    <span class="{getNDScoreColor(activity.nd_score)}">
                      ND: {activity.nd_score ?? '-'}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">
                    {formatDateTime(activity.updated_at)}
                  </div>
                </div>
                <div class="flex gap-2 mt-3">
                  <button
                    on:click={() => quickPublish(activity.id, activity.estat)}
                    class="btn btn-secondary text-xs flex-1"
                  >
                    {activity.estat === 'publicada' ? 'Despublicar' : 'Publicar'}
                  </button>
                  <a href="/activitats/{activity.id}" class="btn btn-primary text-xs flex-1">
                    Editar
                  </a>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <Pagination
        {currentPage}
        {pageSize}
        {totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    {/if}
  </div>
</div>

<ConfirmDialog
  bind:isOpen={showBulkDialog}
  title="Confirmar operació en bloc"
  message="Estàs segur que vols {getBulkOperationText(bulkOperation).toLowerCase()} en {selectedActivities.size} activitat(s)?"
  confirmText="Confirmar"
  confirmVariant="primary"
  onConfirm={executeBulkOperation}
/>
