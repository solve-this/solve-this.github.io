import './style.css'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice'
import { createAppI18n } from './i18n/index'
import { routes, localeFromPath } from './router'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  (ctx) => {
    const { app, routePath } = ctx
    app.use(PrimeVue, {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: false,
        },
      },
    })
    app.use(ToastService)

    // Create a fresh i18n instance per render so parallel SSG renders don't
    // race over a shared singleton's mutable locale value.
    // On the client side, derive the locale from the current URL path.
    const locale = localeFromPath(
      routePath ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
    )
    app.use(createAppI18n(locale))
  },
)
