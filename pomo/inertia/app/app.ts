/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp, router } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/components/App.vue'
import { fr } from '@nuxt/ui/locale'
import CookieConsent from '../components/CookieConsent.vue'

const appName = import.meta.env.VITE_APP_NAME || 'Pomo'

createInertiaApp({
  progress: { color: '#55E0A9' },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue')
    )
  },

  setup({ el, App, props, plugin }) {
    // `locale` passe les composants Nuxt UI en français (libellés internes et
    // noms de mois / jours du UCalendar, sinon rendus en anglais).
    createApp({ render: () => h(UApp, { locale: fr }, () => [h(App, props), h(CookieConsent)]) })
      .use(plugin)
      .use(ui)
      .mount(el)
  },
})

// Transition douce (fondu) entre les pages, si le navigateur le supporte.
if (typeof document !== 'undefined' && 'startViewTransition' in document) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  let finish: (() => void) | null = null

  router.on('start', () => {
    if (reduce.matches) return
    // @ts-expect-error - View Transitions API pas encore typée partout
    document.startViewTransition(() => new Promise<void>((resolve) => (finish = resolve)))
  })

  router.on('finish', () => {
    finish?.()
    finish = null
  })
}

router.on('navigate', () => {
  window.umami?.track()
})
