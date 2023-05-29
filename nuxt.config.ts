// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            title: 'Extractify - Extract compressed files online and securely',
            titleTemplate: '%s - Extractify',
        }
    },
    css: [
        'vuetify/lib/styles/main.css',
        '@mdi/font/css/materialdesignicons.min.css'
    ],
    ssr: false,
    build: {
        transpile: ['vuetify'],
    },
})

