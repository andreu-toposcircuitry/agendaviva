<script lang="ts">
  export let currentPage = 1;
  export let pageSize = 20;
  export let totalCount = 0;
  export let onPageChange: (page: number) => void = () => {};
  export let onPageSizeChange: (size: number) => void = () => {};
  
  $: totalPages = Math.ceil(totalCount / pageSize);
  $: startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  $: endItem = Math.min(currentPage * pageSize, totalCount);
  
  $: pages = (() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    
    return rangeWithDots;
  })();
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }
  
  function changePageSize(size: number) {
    if (size !== pageSize) {
      onPageSizeChange(size);
    }
  }
</script>

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
  <div class="flex items-center gap-2 text-sm text-gray-700">
    <span>Mostrant {startItem}-{endItem} de {totalCount}</span>
    <span class="text-gray-400">|</span>
    <label for="page-size" class="flex items-center gap-2">
      Per pàgina:
      <select
        id="page-size"
        value={pageSize}
        on:change={(e) => changePageSize(parseInt(e.currentTarget.value))}
        class="border border-gray-300 rounded px-2 py-1 text-sm"
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>
  </div>
  
  {#if totalPages > 1}
    <nav class="flex items-center gap-1" aria-label="Paginació">
      <button
        on:click={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Pàgina anterior"
      >
        ←
      </button>
      
      {#each pages as page}
        {#if page === '...'}
          <span class="px-3 py-1 text-gray-400">...</span>
        {:else}
          <button
            on:click={() => goToPage(page)}
            class="px-3 py-1 rounded border {currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}"
            aria-label="Pàgina {page}"
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        {/if}
      {/each}
      
      <button
        on:click={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Pàgina següent"
      >
        →
      </button>
    </nav>
  {/if}
</div>
