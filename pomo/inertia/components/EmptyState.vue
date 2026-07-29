<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
    compact?: boolean
  }>(),
  { icon: 'i-heroicons-inbox', compact: false }
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="compact ? 'px-4 py-8' : 'px-6 py-16'"
  >
    <!-- Pastille illustrée avec halo -->
    <div class="relative" :class="compact ? 'mb-3' : 'mb-5'">
      <div aria-hidden="true" class="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
      <div
        class="relative flex items-center justify-center rounded-2xl border border-default bg-primary/10"
        :class="compact ? 'h-14 w-14' : 'h-20 w-20'"
      >
        <UIcon :name="icon" class="text-primary" :class="compact ? 'h-6 w-6' : 'h-9 w-9'" />
      </div>
    </div>

    <h3 class="font-semibold text-highlighted" :class="compact ? 'text-base' : 'text-lg'">
      {{ title }}
    </h3>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-muted">{{ description }}</p>

    <!-- Slot pour un bouton d'action optionnel -->
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
