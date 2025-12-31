<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { formatDateTime, getEstatColor, truncate } from '$lib/utils/format';
  import { TIPOLOGIA_CODIS, QUAN_ES_FA_CODIS } from '@agendaviva/shared';
  import MunicipiSelect from '$lib/components/MunicipiSelect.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  
  interface AuditLog {
    id: string;
    action: string;
    user_email: string | null;
    payload: any;
    created_at: string;
  }
  
  let activity: any = null;
  let loading = true;
  let saving = false;
  let showPublishDialog = false;
  let showQueueDialog = false;
  let showAuditPanel = false;
  let auditLogs: AuditLog[] = [];
  let loadingAudit = false;
  
  // Form fields
  let nom = '';
  let descripcio = '';
  let tipologiaPrincipal = '';
  let subtipologia = '';
  let municipiId: string | null = null;
  let barriZona = '';
  let espai = '';
  let adreca = '';
  let esOnline = false;
  
  // Schedule
  let quanEsFa = '';
  let dies = '';
  let horari = '';
  let dataInici = '';
  let dataFi = '';
  
  // Age
  let edatMin: number | null = null;
  let edatMax: number | null = null;
  let edatText = '';
  
  // Pricing
  let preu = '';
  let preuMin: number | null = null;
  let preuMax: number | null = null;
  let preuPeriode = '';
  let becesDisponibles = false;
  
  // Contact
  let email = '';
  let telefon = '';
  let web = '';
  let linkInscripcio = '';
  
  // ND Score
  let ndScore: number | null = null;
  let ndNivell = '';
  let ndJustificacio = '';
  let ndRecomanacions: string[] = [];
  let ndRecomanacionsText = '';
  
  // Status
  let estat = '';
  let needsReview = false;
  let reviewReason = '';
  let confiancaGlobal: number | null = null;
  
  // Queue
  let queuePrioritat = 'mitjana';
  let queueMotiu = '';
  
  // Audit
  let inQueue = false;
  
  onMount(async () => {
    await loadActivity();
  });
  
  async function loadActivity() {
    loading = true;
    try {
      const response = await fetch(`/api/activitats/${$page.params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }
      
      const data = await response.json();
      activity = data.activity;
      
      // Populate form fields
      nom = activity.nom || '';
      descripcio = activity.descripcio || '';
      tipologiaPrincipal = activity.tipologia_principal || '';
      subtipologia = activity.subtipologia || '';
      municipiId = activity.municipi_id;
      barriZona = activity.barri_zona || '';
      espai = activity.espai || '';
      adreca = activity.adreca || '';
      esOnline = activity.es_online || false;
      
      quanEsFa = activity.quan_es_fa || '';
      dies = activity.dies || '';
      horari = activity.horari || '';
      dataInici = activity.data_inici || '';
      dataFi = activity.data_fi || '';
      
      edatMin = activity.edat_min;
      edatMax = activity.edat_max;
      edatText = activity.edat_text || '';
      
      preu = activity.preu || '';
      preuMin = activity.preu_min;
      preuMax = activity.preu_max;
      preuPeriode = activity.preu_periode || '';
      becesDisponibles = activity.beques_disponibles || false;
      
      email = activity.email || '';
      telefon = activity.telefon || '';
      web = activity.web || '';
      linkInscripcio = activity.link_inscripcio || '';
      
      ndScore = activity.nd_score;
      ndNivell = activity.nd_nivell || '';
      ndJustificacio = activity.nd_justificacio || '';
      ndRecomanacions = activity.nd_recomanacions || [];
      ndRecomanacionsText = ndRecomanacions.join('\n');
      
      estat = activity.estat || 'pendent';
      needsReview = activity.needs_review || false;
      reviewReason = activity.review_reason || '';
      confiancaGlobal = activity.confianca_global;
      
      // Check if in queue
      checkQueue();
    } catch (error: any) {
      toast.error('Error carregant activitat: ' + error.message);
    } finally {
      loading = false;
    }
  }
  
  async function checkQueue() {
    // Simple check - we could call an API but for now just use needs_review flag
    inQueue = needsReview;
  }
  
  async function handleSave() {
    saving = true;
    try {
      // Prepare update payload
      const updates: any = {
        nom,
        descripcio: descripcio || null,
        tipologia_principal: tipologiaPrincipal,
        subtipologia: subtipologia || null,
        municipi_id: municipiId,
        barri_zona: barriZona || null,
        espai: espai || null,
        adreca: adreca || null,
        es_online: esOnline,
        
        quan_es_fa: quanEsFa || null,
        dies: dies || null,
        horari: horari || null,
        data_inici: dataInici || null,
        data_fi: dataFi || null,
        
        edat_min: edatMin,
        edat_max: edatMax,
        edat_text: edatText || null,
        
        preu: preu || null,
        preu_min: preuMin,
        preu_max: preuMax,
        preu_periode: preuPeriode || null,
        beques_disponibles: becesDisponibles,
        
        email: email || null,
        telefon: telefon || null,
        web: web || null,
        link_inscripcio: linkInscripcio || null,
        
        nd_score: ndScore,
        nd_nivell: ndNivell || null,
        nd_justificacio: ndJustificacio || null,
        nd_recomanacions: ndRecomanacionsText ? ndRecomanacionsText.split('\n').filter(Boolean) : [],
        
        review_reason: reviewReason || null
      };
      
      const response = await fetch(`/api/activitats/${$page.params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save activity');
      }
      
      toast.success('Activitat guardada correctament');
      await loadActivity();
    } catch (error: any) {
      toast.error('Error guardant: ' + error.message);
    } finally {
      saving = false;
    }
  }
  
  async function handlePublishToggle() {
    try {
      const action = estat === 'publicada' ? 'unpublish' : 'publish';
      const response = await fetch(`/api/activitats/${$page.params.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to publish');
      }
      
      toast.success(action === 'publish' ? 'Activitat publicada' : 'Activitat despublicada');
      showPublishDialog = false;
      await loadActivity();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleAddToQueue() {
    if (!queueMotiu.trim()) {
      toast.error('El motiu és obligatori');
      return;
    }
    
    try {
      const response = await fetch(`/api/activitats/${$page.params.id}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prioritat: queuePrioritat,
          motiu: queueMotiu
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add to queue');
      }
      
      toast.success('Activitat afegida a la cua');
      showQueueDialog = false;
      queueMotiu = '';
      await loadActivity();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleRemoveFromQueue() {
    try {
      const response = await fetch(`/api/activitats/${$page.params.id}/queue`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from queue');
      }
      
      toast.success('Activitat eliminada de la cua');
      await loadActivity();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function handleToggleNeedsReview() {
    try {
      const response = await fetch(`/api/activitats/${$page.params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needs_review: !needsReview
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update needs_review');
      }
      
      toast.success(needsReview ? 'Marcat com revisat' : 'Marcat com necessita revisió');
      await loadActivity();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  }
  
  async function loadAuditLogs() {
    if (auditLogs.length > 0) return; // Already loaded
    
    loadingAudit = true;
    try {
      const response = await fetch(`/api/activitats/${$page.params.id}/audit`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      auditLogs = data.auditLogs;
    } catch (error: any) {
      toast.error('Error carregant auditoria: ' + error.message);
    } finally {
      loadingAudit = false;
    }
  }
  
  function toggleAuditPanel() {
    showAuditPanel = !showAuditPanel;
    if (showAuditPanel && auditLogs.length === 0) {
      loadAuditLogs();
    }
  }
  
  function getActionText(action: string): string {
    const actions: Record<string, string> = {
      create: 'Creació',
      update: 'Actualització',
      publish: 'Publicació',
      unpublish: 'Despublicació',
      delete: 'Eliminació',
      queue_add: 'Afegit a cua',
      queue_remove: 'Tret de cua',
      bulk_publish: 'Publicació en bloc',
      bulk_mark_reviewed: 'Marcat revisat (bloc)'
    };
    return actions[action] || action;
  }
</script>

<div class="max-w-6xl mx-auto space-y-6">
  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin text-4xl">⟳</div>
      <p class="mt-2 text-gray-500">Carregant...</p>
    </div>
  {:else if !activity}
    <div class="text-center py-12">
      <p class="text-red-600">Activitat no trobada</p>
      <a href="/activitats" class="btn btn-secondary mt-4">Tornar al llistat</a>
    </div>
  {:else}
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">{activity.nom}</h1>
        <p class="text-sm text-gray-500 mt-1">
          ID: {activity.id} • 
          <span class="badge {getEstatColor(estat)}">{estat}</span>
          {#if needsReview}
            • <span class="text-red-600">⚠ Necessita revisió</span>
          {/if}
        </p>
      </div>
      
      <div class="flex flex-wrap gap-2">
        <button on:click={() => goto('/activitats')} class="btn btn-secondary">
          ← Tornar
        </button>
        <button on:click={toggleAuditPanel} class="btn btn-secondary">
          {showAuditPanel ? 'Amagar' : 'Veure'} Auditoria
        </button>
        {#if inQueue}
          <button on:click={handleRemoveFromQueue} class="btn btn-secondary">
            Treure de cua
          </button>
        {:else}
          <button on:click={() => showQueueDialog = true} class="btn btn-secondary">
            Afegir a cua
          </button>
        {/if}
        <button on:click={handleToggleNeedsReview} class="btn btn-secondary">
          {needsReview ? 'Marcar revisat' : 'Marcar necessita revisió'}
        </button>
        <button on:click={() => showPublishDialog = true} class="btn btn-primary">
          {estat === 'publicada' ? 'Despublicar' : 'Publicar'}
        </button>
      </div>
    </div>
    
    <!-- Audit Panel -->
    {#if showAuditPanel}
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Auditoria</h2>
        {#if loadingAudit}
          <p class="text-gray-500">Carregant...</p>
        {:else if auditLogs.length === 0}
          <p class="text-gray-500">No hi ha registres d'auditoria</p>
        {:else}
          <div class="space-y-2 max-h-96 overflow-y-auto">
            {#each auditLogs as log}
              <div class="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-medium">{getActionText(log.action)}</span>
                    {#if log.user_email}
                      <span class="text-sm text-gray-600">per {log.user_email}</span>
                    {/if}
                  </div>
                  <span class="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                </div>
                {#if log.payload && Object.keys(log.payload).length > 0}
                  <pre class="text-xs text-gray-600 mt-1 overflow-x-auto">{JSON.stringify(log.payload, null, 2)}</pre>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Main Form -->
    <form on:submit|preventDefault={handleSave} class="space-y-6">
      <!-- Basic Info -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Informació Bàsica</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="nom" class="block text-sm font-medium mb-1">Nom de l'activitat *</label>
            <input type="text" id="nom" bind:value={nom} required class="input" />
          </div>
          
          <div class="md:col-span-2">
            <label for="descripcio" class="block text-sm font-medium mb-1">Descripció</label>
            <textarea id="descripcio" bind:value={descripcio} rows="4" class="input"></textarea>
          </div>
          
          <div>
            <label for="tipologia" class="block text-sm font-medium mb-1">Tipologia Principal *</label>
            <select id="tipologia" bind:value={tipologiaPrincipal} required class="input">
              <option value="">Selecciona...</option>
              {#each TIPOLOGIA_CODIS as tip}
                <option value={tip}>{tip}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label for="subtipologia" class="block text-sm font-medium mb-1">Subtipologia</label>
            <input type="text" id="subtipologia" bind:value={subtipologia} class="input" />
          </div>
        </div>
      </div>
      
      <!-- Location -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Ubicació</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="municipi" class="block text-sm font-medium mb-1">Municipi</label>
            <MunicipiSelect bind:value={municipiId} />
          </div>
          
          <div>
            <label for="barri" class="block text-sm font-medium mb-1">Barri / Zona</label>
            <input type="text" id="barri" bind:value={barriZona} class="input" />
          </div>
          
          <div>
            <label for="espai" class="block text-sm font-medium mb-1">Espai</label>
            <input type="text" id="espai" bind:value={espai} placeholder="Casal, Pavelló..." class="input" />
          </div>
          
          <div>
            <label for="adreca" class="block text-sm font-medium mb-1">Adreça</label>
            <input type="text" id="adreca" bind:value={adreca} class="input" />
          </div>
          
          <div class="md:col-span-2">
            <label class="flex items-center gap-2">
              <input type="checkbox" bind:checked={esOnline} />
              <span class="text-sm font-medium">Activitat online</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Schedule -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Horari i Calendari</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="quan-es-fa" class="block text-sm font-medium mb-1">Quan es fa</label>
            <select id="quan-es-fa" bind:value={quanEsFa} class="input">
              <option value="">Selecciona...</option>
              {#each QUAN_ES_FA_CODIS as qef}
                <option value={qef}>{qef}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label for="dies" class="block text-sm font-medium mb-1">Dies</label>
            <input type="text" id="dies" bind:value={dies} placeholder="Dilluns i dimecres" class="input" />
          </div>
          
          <div>
            <label for="horari" class="block text-sm font-medium mb-1">Horari</label>
            <input type="text" id="horari" bind:value={horari} placeholder="17:00-18:30" class="input" />
          </div>
          
          <div>
            <label for="data-inici" class="block text-sm font-medium mb-1">Data Inici</label>
            <input type="date" id="data-inici" bind:value={dataInici} class="input" />
          </div>
          
          <div>
            <label for="data-fi" class="block text-sm font-medium mb-1">Data Fi</label>
            <input type="date" id="data-fi" bind:value={dataFi} class="input" />
          </div>
        </div>
      </div>
      
      <!-- Age Range -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Edat</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="edat-min" class="block text-sm font-medium mb-1">Edat Mínima</label>
            <input type="number" id="edat-min" bind:value={edatMin} min="0" max="25" class="input" />
          </div>
          
          <div>
            <label for="edat-max" class="block text-sm font-medium mb-1">Edat Màxima</label>
            <input type="number" id="edat-max" bind:value={edatMax} min="0" max="25" class="input" />
          </div>
          
          <div>
            <label for="edat-text" class="block text-sm font-medium mb-1">Text Edat</label>
            <input type="text" id="edat-text" bind:value={edatText} placeholder="P3 a 6è" class="input" />
          </div>
        </div>
      </div>
      
      <!-- Pricing -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Preu</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="preu" class="block text-sm font-medium mb-1">Preu (text)</label>
            <input type="text" id="preu" bind:value={preu} placeholder="150€/trimestre o Gratuït" class="input" />
          </div>
          
          <div>
            <label for="preu-min" class="block text-sm font-medium mb-1">Preu Mínim (€)</label>
            <input type="number" id="preu-min" bind:value={preuMin} min="0" step="0.01" class="input" />
          </div>
          
          <div>
            <label for="preu-max" class="block text-sm font-medium mb-1">Preu Màxim (€)</label>
            <input type="number" id="preu-max" bind:value={preuMax} min="0" step="0.01" class="input" />
          </div>
          
          <div>
            <label for="preu-periode" class="block text-sm font-medium mb-1">Període</label>
            <select id="preu-periode" bind:value={preuPeriode} class="input">
              <option value="">Selecciona...</option>
              <option value="sessio">Sessió</option>
              <option value="mes">Mes</option>
              <option value="trimestre">Trimestre</option>
              <option value="curs">Curs</option>
              <option value="total">Total</option>
            </select>
          </div>
          
          <div>
            <label class="flex items-center gap-2 mt-6">
              <input type="checkbox" bind:checked={becesDisponibles} />
              <span class="text-sm font-medium">Beques disponibles</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Contact -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Contacte</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium mb-1">Email</label>
            <input type="email" id="email" bind:value={email} class="input" />
          </div>
          
          <div>
            <label for="telefon" class="block text-sm font-medium mb-1">Telèfon</label>
            <input type="tel" id="telefon" bind:value={telefon} class="input" />
          </div>
          
          <div>
            <label for="web" class="block text-sm font-medium mb-1">Web</label>
            <input type="url" id="web" bind:value={web} class="input" />
          </div>
          
          <div>
            <label for="link-inscripcio" class="block text-sm font-medium mb-1">Link Inscripció</label>
            <input type="url" id="link-inscripcio" bind:value={linkInscripcio} class="input" />
          </div>
        </div>
      </div>
      
      <!-- ND Score -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">ND Score (Neurodiversitat)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="nd-score" class="block text-sm font-medium mb-1">ND Score (1-5)</label>
            <input type="number" id="nd-score" bind:value={ndScore} min="1" max="5" class="input" />
          </div>
          
          <div>
            <label for="nd-nivell" class="block text-sm font-medium mb-1">ND Nivell</label>
            <select id="nd-nivell" bind:value={ndNivell} class="input">
              <option value="">Selecciona...</option>
              <option value="nd_excellent">Excel·lent (5)</option>
              <option value="nd_preparat">Preparat (4)</option>
              <option value="nd_compatible">Compatible (3)</option>
              <option value="nd_variable">Variable (2)</option>
              <option value="nd_desafiador">Desafiador (1)</option>
            </select>
          </div>
          
          <div class="md:col-span-2">
            <label for="nd-justificacio" class="block text-sm font-medium mb-1">Justificació</label>
            <textarea id="nd-justificacio" bind:value={ndJustificacio} rows="3" class="input"></textarea>
          </div>
          
          <div class="md:col-span-2">
            <label for="nd-recomanacions" class="block text-sm font-medium mb-1">Recomanacions (una per línia)</label>
            <textarea id="nd-recomanacions" bind:value={ndRecomanacionsText} rows="4" class="input"></textarea>
          </div>
        </div>
      </div>
      
      <!-- Review & Quality -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Revisió i Qualitat</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Confiança Global</label>
            <p class="text-2xl font-bold {confiancaGlobal && confiancaGlobal >= 70 ? 'text-green-600' : 'text-yellow-600'}">
              {confiancaGlobal ?? 'N/A'}
            </p>
            <p class="text-xs text-gray-500">(Només lectura - calculat per l'agent)</p>
          </div>
          
          <div>
            <label for="review-reason" class="block text-sm font-medium mb-1">Motiu de revisió</label>
            <textarea id="review-reason" bind:value={reviewReason} rows="3" class="input"></textarea>
          </div>
        </div>
      </div>
      
      <!-- Source Info (read-only) -->
      {#if activity.font_url || activity.font_text}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Font Original</h2>
          {#if activity.font_url}
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">URL Font</label>
              <a href={activity.font_url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">
                {activity.font_url}
              </a>
            </div>
          {/if}
          {#if activity.font_text}
            <div>
              <label class="block text-sm font-medium mb-1">Text Font (primer 500 caràcters)</label>
              <div class="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                {truncate(activity.font_text, 500)}
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Agent Response (read-only) -->
      {#if activity.agent_raw_response}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Resposta de l'Agent</h2>
          <details class="text-sm">
            <summary class="cursor-pointer text-blue-600 hover:underline mb-2">Veure resposta completa (JSON)</summary>
            <pre class="bg-gray-50 p-3 rounded overflow-x-auto text-xs">{JSON.stringify(activity.agent_raw_response, null, 2)}</pre>
          </details>
        </div>
      {/if}
      
      <!-- Action Buttons -->
      <div class="flex justify-end gap-4 pt-4">
        <button type="button" on:click={() => goto('/activitats')} class="btn btn-secondary">
          Cancel·lar
        </button>
        <button type="submit" disabled={saving} class="btn btn-primary">
          {#if saving}
            <span class="inline-block animate-spin">⟳</span> Guardant...
          {:else}
            Guardar Canvis
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>

<!-- Publish Dialog -->
<ConfirmDialog
  bind:isOpen={showPublishDialog}
  title={estat === 'publicada' ? 'Despublicar activitat' : 'Publicar activitat'}
  message={estat === 'publicada' 
    ? "Estàs segur que vols despublicar aquesta activitat? Deixarà de ser visible al públic."
    : "Estàs segur que vols publicar aquesta activitat? Serà visible al públic."}
  confirmText={estat === 'publicada' ? 'Despublicar' : 'Publicar'}
  confirmVariant={estat === 'publicada' ? 'danger' : 'primary'}
  onConfirm={handlePublishToggle}
/>

<!-- Queue Dialog -->
{#if showQueueDialog}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    on:click={() => showQueueDialog = false}
    role="dialog"
    aria-modal="true"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      on:click|stopPropagation
    >
      <h2 class="text-xl font-bold mb-4">Afegir a la Cua de Revisió</h2>
      
      <div class="space-y-4">
        <div>
          <label for="queue-prioritat" class="block text-sm font-medium mb-1">Prioritat</label>
          <select id="queue-prioritat" bind:value={queuePrioritat} class="input">
            <option value="baixa">Baixa</option>
            <option value="mitjana">Mitjana</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        
        <div>
          <label for="queue-motiu" class="block text-sm font-medium mb-1">Motiu *</label>
          <textarea 
            id="queue-motiu" 
            bind:value={queueMotiu} 
            rows="3" 
            class="input" 
            placeholder="Per què aquesta activitat necessita revisió?"
            required
          ></textarea>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-6">
        <button
          type="button"
          on:click={() => showQueueDialog = false}
          class="btn btn-secondary"
        >
          Cancel·lar
        </button>
        <button
          type="button"
          on:click={handleAddToQueue}
          class="btn btn-primary"
        >
          Afegir a Cua
        </button>
      </div>
    </div>
  </div>
{/if}
