<script lang="ts">
  interface Props {
    score: number;
    nivell?: string;
    compact?: boolean;
  }

  let { score, nivell, compact = false }: Props = $props();

  const config: Record<number, { bg: string; icon: string; label: string }> = {
    5: { bg: 'bg-green-700 text-white', icon: '++', label: 'ND-Excel·lent' },
    4: { bg: 'bg-green-500 text-white', icon: '+', label: 'ND-Preparat' },
    3: { bg: 'bg-gray-400 text-white', icon: 'o', label: 'ND-Compatible' },
    2: { bg: 'bg-amber-500 text-white', icon: '~', label: 'ND-Variable' },
    1: { bg: 'bg-red-500 text-white', icon: '!', label: 'ND-Desafiador' },
  };

  let style = $derived(config[score] || config[3]);
  let stars = $derived('*'.repeat(score) + '-'.repeat(5 - score));
</script>

{#if compact}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm {style.bg}">
    <span class="font-mono">{style.icon}</span>
    <span>{score}/5</span>
  </span>
{:else}
  <div class="flex items-center gap-3 px-4 py-3 rounded-lg {style.bg}">
    <span class="text-xl font-mono font-bold">{style.icon}</span>
    <div>
      <div class="font-medium">{stars}</div>
      <div class="text-sm opacity-90">{style.label}</div>
    </div>
  </div>
{/if}
