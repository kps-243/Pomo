<script setup lang="ts">
import { computed } from 'vue'
import type { TaskStatus } from '~/types/todo'

const props = defineProps<{
  status: TaskStatus
}>()

const config = {
  todo: { label: 'À faire', classes: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  in_progress: { label: 'En cours', classes: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  done: { label: 'Terminé', classes: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
} as const

const current = computed(() => config[props.status] ?? config.todo)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
    :class="current.classes"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="current.dot" />
    {{ current.label }}
  </span>
</template>
