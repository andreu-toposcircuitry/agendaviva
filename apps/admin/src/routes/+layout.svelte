<script lang="ts">
  import '../app.css';
  import { Auth } from '@supabase/auth-ui-svelte';
  import { ThemeSupa } from '@supabase/auth-ui-shared';
  import { supabase } from '$lib/supabase';
  import { isModerator, user } from '$lib/stores/auth';
</script>

{#if !$user}
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Agenda Viva Admin</h1>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
      />
    </div>
  </div>
{:else if !$isModerator}
  <div class="min-h-screen flex items-center justify-center">
    <p>No tens permisos de moderador.</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white border-b px-4 py-3 flex justify-between items-center">
      <div class="flex gap-6">
        <a href="/" class="font-bold">Admin</a>
        <a href="/cua" class="hover:text-green-600">Cua</a>
        <a href="/activitats" class="hover:text-green-600">Activitats</a>
        <a href="/entitats" class="hover:text-green-600">Entitats</a>
        <a href="/fonts" class="hover:text-green-600">Fonts</a>
      </div>
      <button on:click={() => supabase.auth.signOut()} class="text-sm text-gray-500">
        Sortir
      </button>
    </nav>

    <main class="p-6">
      <slot />
    </main>
  </div>
{/if}
