<script lang="ts">
  import { toast } from '$lib/stores/toast';
  
  export { className as class };
  let className = '';
  
  $: toasts = $toast;
  
  function getToastClass(type: string): string {
    const base = 'px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md';
    const colors = {
      success: 'bg-green-50 text-green-900 border-l-4 border-green-500',
      error: 'bg-red-50 text-red-900 border-l-4 border-red-500',
      warning: 'bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500',
      info: 'bg-blue-50 text-blue-900 border-l-4 border-blue-500'
    };
    return `${base} ${colors[type as keyof typeof colors] || colors.info}`;
  }
  
  function getIcon(type: string): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type as keyof typeof icons] || icons.info;
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 {className}" role="region" aria-label="Notificacions">
  {#each toasts as item (item.id)}
    <div 
      class="{getToastClass(item.type)} animate-slide-in"
      role="alert"
      aria-live="polite"
    >
      <span class="text-2xl font-bold">{getIcon(item.type)}</span>
      <span class="flex-1">{item.message}</span>
      <button
        on:click={() => toast.remove(item.id)}
        class="text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Tancar notificació"
      >
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
