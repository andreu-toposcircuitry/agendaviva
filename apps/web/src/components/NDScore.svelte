<script lang="ts">
  export let score: number = 3;
  export let nivell: string = '';
  export let compact: boolean = false;

  const colors = {
    5: { bg: 'bg-green-700', text: 'text-white', icon: '✓✓' },
    4: { bg: 'bg-green-500', text: 'text-white', icon: '✓' },
    3: { bg: 'bg-gray-400', text: 'text-white', icon: '○' },
    2: { bg: 'bg-amber-500', text: 'text-white', icon: '△' },
    1: { bg: 'bg-red-500', text: 'text-white', icon: '⚠' },
  };

  $: style = colors[score as keyof typeof colors] || colors[3];
  $: stars = '★'.repeat(score) + '☆'.repeat(5 - score);
</script>

{#if compact}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded {style.bg} {style.text} text-sm">
    {style.icon} {score}/5
  </span>
{:else}
  <div class="flex items-center gap-2 px-3 py-2 rounded-lg {style.bg} {style.text}">
    <span class="text-lg">{style.icon}</span>
    <div>
      <div class="font-medium">{stars}</div>
      {#if nivell}
        <div class="text-sm opacity-90">{nivell}</div>
      {/if}
    </div>
  </div>
{/if}
