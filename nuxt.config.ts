// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            title: 'Extract and Explore compressed files online and securely',
            titleTemplate: 'Extractify - %s',
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

