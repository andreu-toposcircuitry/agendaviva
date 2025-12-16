import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'hybrid',
  site: 'https://agendaviva.cat',
  adapter: node({
    mode: 'standalone',
  }),
});
