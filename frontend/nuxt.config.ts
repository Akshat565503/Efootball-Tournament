// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  ssr: false,
  srcDir: 'app',

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  sourcemap: {
    server: false,
    client: false,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },

  app: {
    head: {
      title: 'eFootball Tournament Platform — Knockout Brackets',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Host and join eFootball™ knockout tournaments. Real-time brackets, live match spectating, and community competition — all in one platform.',
        },
        { name: 'theme-color', content: '#0a0e1a' },
        { property: 'og:title', content: 'eFootball Tournament Platform' },
        { property: 'og:description', content: 'Host and join eFootball™ knockout tournaments with real-time brackets and live spectating.' },
        { property: 'og:type', content: 'website' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
})
