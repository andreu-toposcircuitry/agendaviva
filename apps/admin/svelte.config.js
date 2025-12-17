import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// NOTE: Keep using the vite-plugin-svelte preprocess to avoid the legacy
// '@sveltejs/kit/vite' import that breaks builds on SvelteKit 2.

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
