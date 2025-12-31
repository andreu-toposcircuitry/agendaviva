<script lang="ts">
  export let isOpen = false;
  export let title = '';
  export let message = '';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancel·lar';
  export let confirmVariant: 'primary' | 'danger' = 'primary';
  export let onConfirm: () => void | Promise<void> = () => {};
  export let onCancel: () => void = () => {};
  
  let isLoading = false;
  
  async function handleConfirm() {
    isLoading = true;
    try {
      await onConfirm();
      isOpen = false;
    } finally {
      isLoading = false;
    }
  }
  
  function handleCancel() {
    if (!isLoading) {
      onCancel();
      isOpen = false;
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    on:click={handleCancel}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      on:click|stopPropagation
    >
      {#if title}
        <h2 id="dialog-title" class="text-xl font-bold mb-4">{title}</h2>
      {/if}
      
      {#if message}
        <p class="text-gray-700 mb-6">{message}</p>
      {/if}
      
      <slot />
      
      <div class="flex justify-end gap-3 mt-6">
        <button
          type="button"
          on:click={handleCancel}
          disabled={isLoading}
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          type="button"
          on:click={handleConfirm}
          disabled={isLoading}
          class="px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed {confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}"
        >
          {#if isLoading}
            <span class="inline-block animate-spin">⟳</span>
            {confirmText}...
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
