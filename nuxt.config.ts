import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  ssr: false,

  devtools: { enabled: true },

  build: {
    transpile: ['vuetify'],
  },

  modules: [
    '@nuxt/eslint',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // vuetify() returns a Plugin[] which is assignable to the vite PluginOption type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(config.plugins as any[]).push(vuetify({ autoImport: true }))
      })
    },
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  runtimeConfig: {
    // Server-only — populated from .env
    databaseUrl: process.env.DATABASE_URL ?? '',
  },
})
