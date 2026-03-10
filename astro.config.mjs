import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

export default defineConfig({
  site: 'https://synctexts.com',

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  adapter: node({
    mode: 'standalone',
  }),
});