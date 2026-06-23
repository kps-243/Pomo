<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import { usePage } from '@inertiajs/vue3'

const user = usePage().props.user as { id: number; first_name: string; last_name: string; email: string } | null

const logout = () => {
  router.post('/logout')
}

const links = [
  { label: 'Home', icon: 'i-heroicons-home', href: '/' },
  { label: 'ToDoLists', icon: 'i-heroicons-view-columns', href: '/todolists' },
  { label: 'Tasks', icon: 'i-heroicons-check-circle', href: '/tasks' },
  { label: 'Calendar', icon: 'i-heroicons-calendar', href: '/calendar' },
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
  <div class="h-screen flex flex-col">
    <!-- HEADER -->
    <header class="h-16 border-b flex items-center justify-between px-6">
      <h1 class="text-lg font-semibold">Pomo</h1>

      <!-- Connecté : prénom + icône profil dans un dropdown -->
      <UDropdownMenu
        v-if="user"
        :items="items"
        :ui="{
          content: 'bg-white border border-green-500 ring-0 shadow-md rounded-xl',
        }"
      >
        <button class="flex items-center gap-2 cursor-pointer">
          <span class="text-sm font-medium text-gray-800">{{ user.first_name }}</span>
          <UIcon name="i-heroicons-user-circle" class="w-7 h-7 text-gray-600" />
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
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 border-r p-4">
        <UNavigationMenu orientation="vertical" :items="links" />
      </aside>
      <main class="flex-1 p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
