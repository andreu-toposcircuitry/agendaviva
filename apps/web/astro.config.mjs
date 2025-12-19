import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import path from 'path';

export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    resolve: {
      alias: {
        '@agendaviva/shared': path.resolve('../../packages/shared/src/index.ts')
      }
    }
  }
});
