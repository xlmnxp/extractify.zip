// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    css: ['vuetify/lib/styles/main.sass', 'vuetify/lib/components/VCode/VCode.css', '@mdi/font/css/materialdesignicons.min.css',],
    ssr: false,
    build: {
        transpile: ['vuetify'],
    },
    vite: {
        define: {
            'process.env.DEBUG': false,
        },
    },
})

