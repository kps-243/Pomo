<script setup lang="ts">
import { computed } from 'vue'
import { router } from '@inertiajs/vue3'
import type { TaskStatus } from '~/types/todo'

const props = defineProps<{
  status: TaskStatus
  taskId: number
}>()

const config = {
  todo: { label: 'À faire', classes: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  in_progress: { label: 'En cours', classes: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  done: { label: 'Terminé', classes: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
} as const

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

const current = computed(() => config[props.status] ?? config.todo)

const cycleStatus = () => {
  router.put(`/tasks/${props.taskId}`, { status: nextStatus[props.status] }, { preserveScroll: true })
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    :class="current.classes"
    :aria-label="`Statut : ${current.label}. Cliquer pour changer.`"
    @click.stop.prevent="cycleStatus"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="current.dot" />
    {{ current.label }}
  </button>
</template>
