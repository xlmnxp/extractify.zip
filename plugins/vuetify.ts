import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin(nuxtApp => {
  // get system dark mode
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  const vuetify = createVuetify({
    ssr: false,
    components,
    directives,
    theme: {
      defaultTheme: darkMode ? 'dark' : 'light',
    }
  })

  nuxtApp.vueApp.use(vuetify)
})