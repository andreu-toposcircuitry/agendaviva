<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { getPriorityColor, formatDateTime } from '$lib/utils/format';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  
  interface QueueItem {
    id: string;
    activitat_id: string;
    activitat_nom: string;
    prioritat: string;
    motiu: string;
    tipologia_principal: string;
    nd_score: number | null;
    confianca_global: number | null;
    created_at: string;
  }
  
  let queue: QueueItem[] = [];
  let loading = true;
  let selectedItems: Set<string> = new Set();
  let showBulkDialog = false;
  let bulkOperation = '';
  let bulkLoading = false;
  
  // Bulk accept settings
  let showBulkAcceptDialog = false;
  let confiancaThreshold = 70;
  let ndThreshold = 70;
  let bulkPreviewCount = 0;
  
  onMount(async () => {
    await loadQueue();
  });
  
  async function loadQueue() {
    loading = true;
    try {
      const { data } = await import('$lib/supabase').then(m => m.supabase)
        .from('cua_revisio_detall')
        .select('*')
        .order('prioritat')
        .order('created_at');

      queue = data || [];
    } catch (error: any) {
      toast.error('Error carregant cua: ' + error.message);
    } finally {
      loading = false;
    }
  }
  
  function toggleSelect(id: string) {
    if (selectedItems.has(id)) {
      selectedItems.delete(id);
    } else {
      selectedItems.add(id);
    }
    selectedItems = selectedItems;
  }
  
  function toggleSelectAll() {
    if (selectedItems.size === queue.length) {
      selectedItems.clear();
    } else {
      queue.forEach(item => selectedItems.add(item.id));
    }
    selectedItems = selectedItems;
  }
  
  async function handleAccept(activitatId: string, removeFromQueue = true) {
    try {
      // Publish the activity
      const publishResponse = await fetch(`/api/activitats/${activitatId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' })
      });
      
      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.message || 'Failed to publish');
      }
      
      if (removeFromQueue) {
        // Remove from queue
        await fetch(`/api/activitats/${activitatId}/queue`, {
          method: 'DELETE'
        });
      }
      
      toast.success('Activitat acceptada i publicada');
      await loadQueue();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleAcceptPending(activitatId: string) {
    try {
      // Just mark as reviewed and remove from queue
      const response = await fetch(`/api/activitats/${activitatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs_review: false })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update');
      }
      
      // Remove from queue
      await fetch(`/api/activitats/${activitatId}/queue`, {
        method: 'DELETE'
      });
      
      toast.success('Activitat marcada com revisada però manté estat pendent');
      await loadQueue();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleReject(activitatId: string, reason: string = 'Rebutjada des de la cua') {
    try {
      // Update activity to set review reason and needs_review
      const response = await fetch(`/api/activitats/${activitatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estat: 'rebutjada',
          needs_review: true,
          review_reason: reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject');
      }
      
      // Remove from queue
      await fetch(`/api/activitats/${activitatId}/queue`, {
        method: 'DELETE'
      });
      
      toast.success('Activitat rebutjada');
      await loadQueue();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleDefer(activitatId: string) {
    // Just remove from current view - stays in queue
    toast.info('Activitat ajornada');
  }
  
  function openBulkDialog(operation: string) {
    if (selectedItems.size === 0) {
      toast.warning('Selecciona almenys un element');
      return;
    }
    bulkOperation = operation;
    
    if (operation === 'bulk_accept') {
      showBulkAcceptDialog = true;
      calculateBulkPreview();
    } else {
      showBulkDialog = true;
    }
  }
  
  function calculateBulkPreview() {
    // Count how many items meet the threshold
    const selectedActivities = queue.filter(item => selectedItems.has(item.id));
    bulkPreviewCount = selectedActivities.filter(item =>
      ((item.confianca_global !== null && item.confianca_global >= confiancaThreshold) ||
       (item.nd_score !== null && item.nd_score * 20 >= ndThreshold)) &&
      item.activitat_id // Ensure activity exists
    ).length;
  }
  
  async function executeBulkOperation() {
    bulkLoading = true;
    try {
      const selectedActivities = queue.filter(item => selectedItems.has(item.id));
      const activityIds = selectedActivities.map(item => item.activitat_id);
      
      let successCount = 0;
      
      if (bulkOperation === 'bulk_accept') {
        // Use the bulk publish endpoint
        const response = await fetch('/api/activitats/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'bulk_publish',
            activityIds,
            confiancaThreshold,
            ndConfiancaThreshold: ndThreshold
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to bulk publish');
        }
        
        const data = await response.json();
        successCount = data.count;
        
        // Remove successful ones from queue
        for (const id of activityIds) {
          await fetch(`/api/activitats/${id}/queue`, {
            method: 'DELETE'
          }).catch(() => {}); // Ignore errors
        }
      } else if (bulkOperation === 'bulk_mark_reviewed') {
        // Mark as reviewed and remove from queue
        for (const id of activityIds) {
          try {
            await fetch(`/api/activitats/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ needs_review: false })
            });
            
            await fetch(`/api/activitats/${id}/queue`, {
              method: 'DELETE'
            });
            
            successCount++;
          } catch (e) {
            // Continue with next
          }
        }
      }
      
      toast.success(`Operació completada: ${successCount} activitats processades`);
      selectedItems.clear();
      selectedItems = selectedItems;
      showBulkDialog = false;
      showBulkAcceptDialog = false;
      await loadQueue();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      bulkLoading = false;
    }
  }
  
  function getBulkOperationText(operation: string): string {
    const texts: Record<string, string> = {
      bulk_accept: 'Acceptar i publicar seleccionades',
      bulk_mark_reviewed: 'Marcar com revisades'
    };
    return texts[operation] || operation;
  }
</script>

<div class="space-y-4">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold">Cua de Revisió</h1>
      <p class="text-sm text-gray-500 mt-1">
        {queue.length} {queue.length === 1 ? 'element pendent' : 'elements pendents'}
        {#if selectedItems.size > 0}
          • {selectedItems.size} {selectedItems.size === 1 ? 'seleccionat' : 'seleccionats'}
        {/if}
      </p>
    </div>
    
    {#if selectedItems.size > 0}
      <div class="flex gap-2">
        <button on:click={() => openBulkDialog('bulk_accept')} class="btn btn-success text-sm">
          Acceptar ({selectedItems.size})
        </button>
        <button on:click={() => openBulkDialog('bulk_mark_reviewed')} class="btn btn-secondary text-sm">
          Marcar revisades ({selectedItems.size})
        </button>
      </div>
    {/if}
  </div>
  
  {#if loading}
    <div class="card text-center py-12">
      <div class="inline-block animate-spin text-4xl">⟳</div>
      <p class="mt-2 text-gray-500">Carregant...</p>
    </div>
  {:else if queue.length === 0}
    <div class="card text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <p class="text-lg font-medium text-gray-700">No hi ha res pendent de revisar!</p>
      <p class="text-sm text-gray-500 mt-2">Totes les activitats han estat revisades.</p>
      <a href="/activitats" class="btn btn-primary mt-6">
        Veure totes les activitats
      </a>
    </div>
  {:else}
    <div class="card">
      <!-- Desktop table -->
      <div class="hidden md:block table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th class="w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.size === queue.length && queue.length > 0}
                  on:change={toggleSelectAll}
                  aria-label="Seleccionar tots"
                />
              </th>
              <th>Prioritat</th>
              <th>Activitat</th>
              <th>Tipologia</th>
              <th>Motiu</th>
              <th>Conf.</th>
              <th>ND</th>
              <th>Data</th>
              <th>Accions</th>
            </tr>
          </thead>
          <tbody>
            {#each queue as item}
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    on:change={() => toggleSelect(item.id)}
                    aria-label="Seleccionar {item.activitat_nom}"
                  />
                </td>
                <td>
                  <span class="badge {getPriorityColor(item.prioritat)}">
                    {item.prioritat}
                  </span>
                </td>
                <td>
                  <a href="/activitats/{item.activitat_id}" class="text-blue-600 hover:underline font-medium">
                    {item.activitat_nom}
                  </a>
                </td>
                <td class="text-sm">{item.tipologia_principal}</td>
                <td class="text-sm text-gray-600 max-w-xs truncate">{item.motiu}</td>
                <td class="font-medium {item.confianca_global && item.confianca_global >= 70 ? 'text-green-600' : 'text-yellow-600'}">
                  {item.confianca_global ?? '-'}
                </td>
                <td class="font-medium {item.nd_score && item.nd_score >= 4 ? 'text-green-600' : 'text-yellow-600'}">
                  {item.nd_score ?? '-'}
                </td>
                <td class="text-xs text-gray-500">
                  {formatDateTime(item.created_at)}
                </td>
                <td>
                  <div class="flex gap-1">
                    <button
                      on:click={() => handleAccept(item.activitat_id)}
                      class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                      title="Acceptar i publicar"
                    >
                      ✓
                    </button>
                    <button
                      on:click={() => handleAcceptPending(item.activitat_id)}
                      class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      title="Acceptar però mantenir pendent"
                    >
                      ○
                    </button>
                    <button
                      on:click={() => handleReject(item.activitat_id)}
                      class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      title="Rebutjar"
                    >
                      ✕
                    </button>
                    <a
                      href="/activitats/{item.activitat_id}"
                      class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        {#each queue as item}
          <div class="border rounded-lg p-4">
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                on:change={() => toggleSelect(item.id)}
                class="mt-1"
                aria-label="Seleccionar {item.activitat_nom}"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge {getPriorityColor(item.prioritat)}">{item.prioritat}</span>
                </div>
                <a href="/activitats/{item.activitat_id}" class="text-blue-600 hover:underline font-medium block mb-2">
                  {item.activitat_nom}
                </a>
                <div class="space-y-1 text-sm">
                  <div class="text-gray-600">{item.tipologia_principal}</div>
                  <div class="text-gray-500 italic">{item.motiu}</div>
                  <div class="flex gap-4 text-gray-500">
                    <span>Conf: {item.confianca_global ?? '-'}</span>
                    <span>ND: {item.nd_score ?? '-'}</span>
                  </div>
                  <div class="text-xs text-gray-400">
                    {formatDateTime(item.created_at)}
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-3">
                  <button
                    on:click={() => handleAccept(item.activitat_id)}
                    class="btn btn-success text-xs"
                  >
                    Acceptar
                  </button>
                  <button
                    on:click={() => handleAcceptPending(item.activitat_id)}
                    class="btn btn-secondary text-xs"
                  >
                    Pendent
                  </button>
                  <button
                    on:click={() => handleReject(item.activitat_id)}
                    class="btn btn-danger text-xs"
                  >
                    Rebutjar
                  </button>
                  <a
                    href="/activitats/{item.activitat_id}"
                    class="btn btn-secondary text-xs text-center"
                  >
                    Editar
                  </a>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Bulk Accept Dialog with Settings -->
{#if showBulkAcceptDialog}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    on:click={() => showBulkAcceptDialog = false}
    role="dialog"
    aria-modal="true"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-bold mb-4">Acceptació en Bloc</h2>
      
      <div class="space-y-4 mb-6">
        <p class="text-sm text-gray-600">
          Configuració de seguretat: només s'acceptaran activitats que compleixin aquests requisits:
        </p>
        
        <div>
          <label for="confianca-threshold" class="block text-sm font-medium mb-1">
            Confiança Global Mínima (%)
          </label>
          <input
            type="number"
            id="confianca-threshold"
            bind:value={confiancaThreshold}
            on:input={calculateBulkPreview}
            min="0"
            max="100"
            class="input"
          />
        </div>
        
        <div>
          <label for="nd-threshold" class="block text-sm font-medium mb-1">
            ND Confiança Mínima (%)
          </label>
          <input
            type="number"
            id="nd-threshold"
            bind:value={ndThreshold}
            on:input={calculateBulkPreview}
            min="0"
            max="100"
            class="input"
          />
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm font-medium text-blue-900">
            Activitats que es processaran: <span class="text-lg font-bold">{bulkPreviewCount}</span> de {selectedItems.size}
          </p>
          <p class="text-xs text-blue-700 mt-1">
            Les activitats també necessiten tenir municipi i tipologia definits.
          </p>
        </div>
      </div>
      
      <div class="flex justify-end gap-3">
        <button
          type="button"
          on:click={() => showBulkAcceptDialog = false}
          disabled={bulkLoading}
          class="btn btn-secondary"
        >
          Cancel·lar
        </button>
        <button
          type="button"
          on:click={executeBulkOperation}
          disabled={bulkLoading || bulkPreviewCount === 0}
          class="btn btn-primary"
        >
          {#if bulkLoading}
            <span class="inline-block animate-spin">⟳</span> Processant...
          {:else}
            Acceptar {bulkPreviewCount} Activitats
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Generic Bulk Dialog -->
<ConfirmDialog
  bind:isOpen={showBulkDialog}
  title="Confirmar operació en bloc"
  message="Estàs segur que vols {getBulkOperationText(bulkOperation).toLowerCase()}?"
  confirmText="Confirmar"
  confirmVariant="primary"
  onConfirm={executeBulkOperation}
/>
