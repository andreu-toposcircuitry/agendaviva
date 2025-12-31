<script lang="ts">
  import { MUNICIPIS } from '@agendaviva/shared';
  
  export let value: string | null = null;
  export let required = false;
  export let disabled = false;
  
  let searchQuery = '';
  let isOpen = false;
  let inputElement: HTMLInputElement;
  
  $: selectedMunicipi = value ? MUNICIPIS.find(m => m.id === value) : null;
  $: filteredMunicipis = MUNICIPIS.filter(m => 
    m.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);
  
  function selectMunicipi(municipiId: string) {
    value = municipiId;
    isOpen = false;
    searchQuery = '';
  }
  
  function clearSelection() {
    value = null;
    searchQuery = '';
    isOpen = false;
  }
  
  function handleFocus() {
    isOpen = true;
  }
  
  function handleBlur() {
    setTimeout(() => {
      isOpen = false;
      searchQuery = '';
    }, 200);
  }
</script>

<div class="relative">
  {#if selectedMunicipi}
    <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white">
      <span class="flex-1">{selectedMunicipi.nom}</span>
      {#if !required && !disabled}
        <button
          type="button"
          on:click={clearSelection}
          class="text-gray-400 hover:text-gray-600"
          aria-label="Esborra la selecció"
        >
          ✕
        </button>
      {/if}
    </div>
  {:else}
    <div class="relative">
      <input
        type="text"
        bind:this={inputElement}
        bind:value={searchQuery}
        on:focus={handleFocus}
        on:blur={handleBlur}
        placeholder="Cerca un municipi..."
        class="w-full px-3 py-2 border border-gray-300 rounded"
        {disabled}
        aria-label="Cerca municipi"
        aria-autocomplete="list"
        aria-expanded={isOpen}
      />
      
      {#if isOpen && filteredMunicipis.length > 0}
        <div 
          class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {#each filteredMunicipis as municipi}
            <button
              type="button"
              on:mousedown={() => selectMunicipi(municipi.id)}
              class="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              role="option"
              aria-selected={value === municipi.id}
            >
              <div class="font-medium">{municipi.nom}</div>
              <div class="text-xs text-gray-500">{municipi.id}</div>
            </button>
          {/each}
        </div>
      {/if}
      
      {#if isOpen && searchQuery && filteredMunicipis.length === 0}
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg p-3 text-sm text-gray-500">
          No s'han trobat municipis
        </div>
      {/if}
    </div>
  {/if}
</div>
