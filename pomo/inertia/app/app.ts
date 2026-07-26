/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp, router } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import ui from '@nuxt/ui/vue-plugin'
import UApp from '@nuxt/ui/components/App.vue'

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
    createApp({ render: () => h(UApp, () => h(App, props)) })
      .use(plugin)
      .use(ui)
      .mount(el)
  },
})

router.on('navigate', () => {
  window.umami?.track()
})
