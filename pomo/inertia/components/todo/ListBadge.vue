<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <span
    data-cy="list-badge"
    class="inline-flex max-w-40 items-center gap-1.5 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-secondary-800 dark:text-secondary-300"
    :aria-label="`Liste : ${name}`"
  >
    <UIcon name="i-heroicons-queue-list" class="h-3.5 w-3.5 shrink-0" />
    <span class="truncate">{{ name }}</span>
  </span>
</template>
