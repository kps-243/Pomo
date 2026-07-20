<script setup lang="ts">
import { ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { usePage } from '@inertiajs/vue3'
import { useTheme } from '~/composables/use_theme'

const { isDark, toggleTheme } = useTheme()

const page = usePage()
const menuOpen = ref(false)

watch(
  () => page.url,
  () => {
    menuOpen.value = false
  }
)

const user = usePage().props.user as {
  id: number
  first_name: string
  last_name: string
  email: string
} | null

const logout = () => {
  router.post('/logout')
}

const links = [
  { label: 'Dashboard', icon: 'i-heroicons-home', href: '/', exact: true },
  { label: 'To do lists', icon: 'i-heroicons-view-columns', href: '/todolists' },
  // À rebrancher quand les pages existeront (phase front) :
  // { label: 'Calendrier', icon: 'i-heroicons-calendar', href: '/calendar' },
  // { label: 'Évènements', icon: 'i-heroicons-sparkles', href: '/events' },
  // { label: 'Tchats', icon: 'i-heroicons-chat-bubble-left-right', href: '/chats' },
]

const items = [
  {
    label: 'Mon profil',
    icon: 'i-heroicons-user',
  },
  {
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onClick: logout,
  },
]
</script>

<template>
  <div class="flex h-screen flex-col bg-default text-default">
    <!-- Permet d'atteindre le contenu directement au clavier, sans traverser la navigation -->
    <a
      href="#contenu"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-inverted"
    >
      Aller au contenu principal
    </a>

    <!-- HEADER -->
    <header class="flex h-16 items-center justify-between border-b border-default px-4 lg:px-6">
      <div class="flex items-center gap-2">
        <!-- Burger : la navigation passe en slideover sous lg -->
        <UButton
          icon="i-heroicons-bars-3"
          aria-label="Ouvrir le menu"
          aria-controls="navigation-mobile"
          :aria-expanded="menuOpen"
          variant="ghost"
          color="neutral"
          class="lg:hidden"
          @click="menuOpen = true"
        />
        <h1 class="text-lg font-semibold text-highlighted">Pomo</h1>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'"
          variant="ghost"
          color="neutral"
          @click="toggleTheme()"
        />

        <!-- Connecté : prénom + icône profil dans un dropdown -->
        <UDropdownMenu
          v-if="user"
          :items="items"
          :ui="{ content: 'bg-default border border-default ring-0 shadow-md rounded-xl' }"
        >
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span class="hidden text-sm font-medium text-highlighted sm:inline">
              {{ user.first_name }}
            </span>
            <UIcon name="i-heroicons-user-circle" class="h-7 w-7 text-muted" />
          </button>
        </UDropdownMenu>

        <!-- Non connecté : bouton login -->
        <UButton
          v-else
          label="Login"
          icon="i-heroicons-arrow-right-on-rectangle"
          variant="outline"
          color="neutral"
          @click="router.visit('/login')"
        />
      </div>
    </header>

    <!-- Navigation mobile -->
    <USlideover
      v-model:open="menuOpen"
      side="left"
      title="Navigation"
      :ui="{ content: 'w-64 max-w-[80vw]' }"
    >
      <template #body>
        <nav id="navigation-mobile">
          <UNavigationMenu orientation="vertical" :items="links" />
        </nav>
      </template>
    </USlideover>

    <div class="flex flex-1 overflow-hidden">
      <!-- Navigation desktop -->
      <aside class="hidden w-64 shrink-0 border-r border-default p-4 lg:block">
        <UNavigationMenu orientation="vertical" :items="links" />
      </aside>
      <main id="contenu" class="flex-1 overflow-y-auto p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
