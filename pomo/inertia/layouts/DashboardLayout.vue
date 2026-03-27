<script setup>
const links = [
  { label: 'Home', icon: 'i-heroicons-home', href: '/' },
  { label: 'Tasks', icon: 'i-heroicons-check-circle', href: '/tasks' },
  { label: 'Calendar', icon: 'i-heroicons-calendar', href: '/calendar' },
]
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- HEADER -->
    <header class="h-16 border-b flex items-center justify-between px-6">
      <h1 class="text-lg font-semibold">Pomo</h1>
      <div class="flex items-center gap-3">
        <UButton icon="i-heroicons-bell" variant="ghost" />
        <UAvatar src="https://i.pravatar.cc/40" />
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 border-r p-4">
        <UNavigationMenu orientation="vertical" :items="links" />
      </aside>
      <!-- MAIN CONTENT -->
      <main class="flex-1 p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
