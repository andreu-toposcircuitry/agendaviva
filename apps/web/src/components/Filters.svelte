<script lang="ts">
  interface Municipi {
    id: string;
    nom: string;
  }

  interface CurrentParams {
    q?: string;
    municipi?: string;
    tipologia?: string;
    ndMin?: number;
    edat?: number;
  }

  interface Props {
    municipis: Municipi[];
    currentParams: CurrentParams;
  }

  let { municipis, currentParams }: Props = $props();

  let selectedMunicipi = $state(currentParams.municipi || '');
  let selectedTipologia = $state(currentParams.tipologia || '');
  let selectedNdMin = $state(currentParams.ndMin?.toString() || '');
  let selectedEdat = $state(currentParams.edat?.toString() || '');
  let isOpen = $state(false);

  const tipologies = [
    { codi: 'arts', nom: 'Arts' },
    { codi: 'esports', nom: 'Esports' },
    { codi: 'natura_ciencia', nom: 'Natura i Ciència' },
    { codi: 'cultura_popular', nom: 'Cultura Popular' },
    { codi: 'llengua_cultura', nom: 'Llengua i Cultura' },
    { codi: 'lleure', nom: 'Lleure' },
    { codi: 'social_comunitari', nom: 'Social i Comunitari' },
    { codi: 'accio_social', nom: 'Acció Social' },
    { codi: 'educacio_reforc', nom: 'Educació i Reforç' },
  ];

  function applyFilters() {
    const params = new URLSearchParams();
    if (currentParams.q) params.set('q', currentParams.q);
    if (selectedMunicipi) params.set('municipi', selectedMunicipi);
    if (selectedTipologia) params.set('tipologia', selectedTipologia);
    if (selectedNdMin) params.set('nd_min', selectedNdMin);
    if (selectedEdat) params.set('edat', selectedEdat);

    const queryString = params.toString();
    window.location.href = `/cerca${queryString ? '?' + queryString : ''}`;
  }

  function clearFilters() {
    selectedMunicipi = '';
    selectedTipologia = '';
    selectedNdMin = '';
    selectedEdat = '';
    const params = new URLSearchParams();
    if (currentParams.q) params.set('q', currentParams.q);
    const queryString = params.toString();
    window.location.href = `/cerca${queryString ? '?' + queryString : ''}`;
  }

  let hasFilters = $derived(
    selectedMunicipi || selectedTipologia || selectedNdMin || selectedEdat
  );
</script>

<!-- Mobile toggle -->
<button
  onclick={() => (isOpen = !isOpen)}
  class="md:hidden w-full flex items-center justify-between p-3 bg-white rounded-lg border mb-4"
>
  <span class="font-medium">Filtres</span>
  <svg
    class="w-5 h-5 transition-transform {isOpen ? 'rotate-180' : ''}"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
  </svg>
</button>

<aside class="bg-white rounded-lg border p-4 {isOpen ? 'block' : 'hidden'} md:block">
  <h2 class="font-semibold mb-4">Filtres</h2>

  <div class="space-y-4">
    <!-- Municipi -->
    <div>
      <label for="filter-municipi" class="block text-sm font-medium text-gray-700 mb-1">
        Municipi
      </label>
      <select
        id="filter-municipi"
        bind:value={selectedMunicipi}
        class="input text-sm"
      >
        <option value="">Tots els municipis</option>
        {#each municipis as municipi}
          <option value={municipi.id}>{municipi.nom}</option>
        {/each}
      </select>
    </div>

    <!-- Tipologia -->
    <div>
      <label for="filter-tipologia" class="block text-sm font-medium text-gray-700 mb-1">
        Categoria
      </label>
      <select
        id="filter-tipologia"
        bind:value={selectedTipologia}
        class="input text-sm"
      >
        <option value="">Totes les categories</option>
        {#each tipologies as tip}
          <option value={tip.codi}>{tip.nom}</option>
        {/each}
      </select>
    </div>

    <!-- ND Score -->
    <div>
      <label for="filter-nd" class="block text-sm font-medium text-gray-700 mb-1">
        Nivell ND mínim
      </label>
      <select
        id="filter-nd"
        bind:value={selectedNdMin}
        class="input text-sm"
      >
        <option value="">Qualsevol</option>
        <option value="4">ND-Friendly (4+)</option>
        <option value="5">ND-Excel·lent (5)</option>
      </select>
    </div>

    <!-- Edat -->
    <div>
      <label for="filter-edat" class="block text-sm font-medium text-gray-700 mb-1">
        Edat del nen/a
      </label>
      <select
        id="filter-edat"
        bind:value={selectedEdat}
        class="input text-sm"
      >
        <option value="">Qualsevol edat</option>
        {#each Array.from({ length: 18 }, (_, i) => i + 1) as age}
          <option value={age.toString()}>{age} anys</option>
        {/each}
      </select>
    </div>

    <!-- Buttons -->
    <div class="flex gap-2 pt-2">
      <button onclick={applyFilters} class="btn btn-primary flex-1 text-sm">
        Aplicar
      </button>
      {#if hasFilters}
        <button onclick={clearFilters} class="btn btn-secondary text-sm">
          Esborrar
        </button>
      {/if}
    </div>
  </div>
</aside>
