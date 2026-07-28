<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
  }>(),
  { icon: 'i-heroicons-inbox' }
)
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <!-- Pastille illustrée avec halo -->
    <div class="relative mb-5">
      <div aria-hidden="true" class="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
      <div
        class="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-default bg-primary/10"
      >
        <UIcon :name="icon" class="h-9 w-9 text-primary" />
      </div>
    </div>

    <h3 class="text-lg font-semibold text-highlighted">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-muted">{{ description }}</p>

    <!-- Slot pour un bouton d'action optionnel -->
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
