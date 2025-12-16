<script lang="ts">
  let query = $state('');
  let isFocused = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/cerca?q=${encodeURIComponent(query.trim())}`;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  }
</script>

<form onsubmit={handleSubmit} class="w-full max-w-2xl mx-auto">
  <div class="relative">
    <input
      type="search"
      bind:value={query}
      onfocus={() => (isFocused = true)}
      onblur={() => (isFocused = false)}
      onkeydown={handleKeydown}
      placeholder="Cerca activitats..."
      class="w-full px-5 py-4 pr-14 text-lg rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur text-white placeholder-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
    />
    <button
      type="submit"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/20 transition-colors"
      aria-label="Cercar"
    >
      <svg
        class="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  </div>

  <div class="mt-4 flex flex-wrap justify-center gap-2">
    <a
      href="/cerca?tipologia=arts"
      class="px-3 py-1 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
    >
      Arts
    </a>
    <a
      href="/cerca?tipologia=esports"
      class="px-3 py-1 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
    >
      Esports
    </a>
    <a
      href="/cerca?tipologia=lleure"
      class="px-3 py-1 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
    >
      Lleure
    </a>
    <a
      href="/nd-friendly"
      class="px-3 py-1 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
    >
      ND-Friendly
    </a>
  </div>
</form>
