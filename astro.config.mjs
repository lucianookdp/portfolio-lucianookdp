// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucianookdp.dev',
  output: 'static',
  trailingSlash: 'never',

  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  // The dev toolbar's own hooks break ClientRouter navigations in dev on
  // this setup (the language switch would silently stall).
  devToolbar: { enabled: false },

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'pt',
        locales: { pt: 'pt-BR', en: 'en' }
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline assets as data: URIs — the page ships a strict CSP
      // (font-src/img-src 'self') that would block them.
      assetsInlineLimit: 0
    },
    optimizeDeps: {
      // Pre-bundle everything the islands and lazy chunks pull in, so Vite
      // never re-optimizes mid-session (which 504s already-loaded modules and
      // breaks the first client-side navigation in dev).
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'motion',
        'motion/react',
        'cmdk',
        'lenis',
        'three',
        'three/examples/jsm/environments/RoomEnvironment.js',
        'ogl',
        'astro/virtual-modules/transitions-router.js',
        'astro/virtual-modules/transitions-events.js',
        'astro/virtual-modules/transitions-swap-functions.js',
        'astro/virtual-modules/transitions-types.js'
      ]
    }
  }
});
