import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://synctexts.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
