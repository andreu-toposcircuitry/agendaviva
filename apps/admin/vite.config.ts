import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  envPrefix: 'PUBLIC_',
  resolve: {
    alias: {
      '@agendaviva/shared': path.resolve('../../packages/shared/src/index.ts')
    }
  }
});
