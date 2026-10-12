import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

import sitemap from '@astrojs/sitemap';

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

  integrations: [
    sitemap({
      // /team/hafizal is a redirect stub, not a real page
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/api') && !page.includes('/team/hafizal'),
    }),
  ],
});