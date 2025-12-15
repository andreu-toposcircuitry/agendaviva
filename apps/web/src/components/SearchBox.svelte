<script lang="ts">
  import { onMount } from 'svelte';
  
  let searchQuery = '';
  let suggestions: any[] = [];
  let showSuggestions = false;

  async function handleSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/cerca?q=${encodeURIComponent(searchQuery)}`;
    }
  }

  async function fetchSuggestions() {
    if (searchQuery.length < 2) {
      suggestions = [];
      showSuggestions = false;
      return;
    }

    try {
      const response = await fetch(`/api/suggest?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        suggestions = await response.json();
        showSuggestions = suggestions.length > 0;
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchSuggestions, 300);
  }

  function selectSuggestion(suggestion: any) {
    window.location.href = `/activitat/${suggestion.slug}`;
  }
</script>

<div class="relative max-w-2xl mx-auto">
  <form on:submit={handleSearch} class="relative">
    <input
      type="text"
      bind:value={searchQuery}
      on:input={handleInput}
      on:focus={() => searchQuery.length >= 2 && (showSuggestions = true)}
      placeholder="Busca activitats... (teatre, robòtica, natació...)"
      class="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-primary-500 focus:outline-none shadow-lg"
    />
    <button
      type="submit"
      class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary rounded-full px-6"
    >
      Cercar
    </button>
  </form>

  {#if showSuggestions && suggestions.length > 0}
    <div class="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
      {#each suggestions as suggestion}
        <button
          type="button"
          on:click={() => selectSuggestion(suggestion)}
          class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
        >
          <div class="font-medium text-gray-900">{suggestion.nom}</div>
          <div class="text-sm text-gray-500">
            {suggestion.tipologia_principal} · {suggestion.municipi}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<svelte:window on:click={() => (showSuggestions = false)} />
