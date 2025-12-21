import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import path from 'path';

export default defineConfig({
  integrations: [svelte(), tailwind()],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    routes: {
      strategy: 'auto'
    }
  }),
  vite: {
    resolve: {
      alias: {
        '@agendaviva/shared': path.resolve('../../packages/shared/src/index.ts')
      }
    },
    ssr: {
      external: ['node:buffer', 'node:crypto']
    }
  }
});
