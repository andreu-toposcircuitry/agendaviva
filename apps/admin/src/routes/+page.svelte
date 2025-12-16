<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  type Stats = {
    totalPublicades: number;
    totalPendents: number;
    cuaPendents: number;
    totalEntitats: number;
    ndFriendly: number;
  };

  let stats: Stats = {
    totalPublicades: 0,
    totalPendents: 0,
    cuaPendents: 0,
    totalEntitats: 0,
    ndFriendly: 0
  };

  onMount(async () => {
    const { data } = await supabase.from('stats_dashboard').select('*').single();
    if (data) stats = data as Stats;
  });
</script>

<h1 class="text-2xl font-bold mb-8">Dashboard</h1>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="bg-white p-6 rounded-lg shadow">
    <div class="text-3xl font-bold text-green-600">{stats.totalPublicades}</div>
    <div class="text-gray-500">Activitats publicades</div>
  </div>

  <div class="bg-white p-6 rounded-lg shadow">
    <div class="text-3xl font-bold text-amber-600">{stats.cuaPendents}</div>
    <div class="text-gray-500">Pendents de revisió</div>
    <a href="/cua" class="text-sm text-blue-600 hover:underline">Revisar →</a>
  </div>

  <div class="bg-white p-6 rounded-lg shadow">
    <div class="text-3xl font-bold">{stats.totalEntitats}</div>
    <div class="text-gray-500">Entitats</div>
  </div>

  <div class="bg-white p-6 rounded-lg shadow">
    <div class="text-3xl font-bold text-green-700">{stats.ndFriendly}</div>
    <div class="text-gray-500">ND-Friendly (≥4)</div>
  </div>
</div>
