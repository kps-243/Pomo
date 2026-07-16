<script setup lang="ts">
import { computed } from 'vue'
import { router } from '@inertiajs/vue3'
import type { TaskStatus } from '~/types/todo'

const props = defineProps<{
  status: TaskStatus
  taskId: number
}>()

const config = {
  todo: {
    label: 'À faire',
    classes: 'bg-elevated text-toned',
  },
  in_progress: {
    label: 'En cours',
    classes: 'bg-warning/10 text-warning-800 dark:text-warning-300',
  },
  done: {
    label: 'Terminé',
    classes: 'bg-success/10 text-success-800 dark:text-success-300',
  },
} as const

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

const current = computed(() => config[props.status] ?? config.todo)

const cycleStatus = () => {
  router.put(
    `/tasks/${props.taskId}`,
    { status: nextStatus[props.status] },
    { preserveScroll: true }
  )
}
</script>

<template>
  <button
    type="button"
    data-cy="status-badge"
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :class="current.classes"
    :aria-label="`Statut : ${current.label}. Cliquer pour changer.`"
    @click.stop.prevent="cycleStatus"
  >
    <span class="h-1.5 w-1.5 rounded-full bg-current" />
    {{ current.label }}
  </button>
</template>
