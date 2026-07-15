<script setup lang="ts">
import { computed } from 'vue'
import { formatDueDateShort } from '~/utils/date'

const props = defineProps<{
  dueDate: string | null
}>()

const formatted = computed(() => (props.dueDate ? formatDueDateShort(props.dueDate) : null))
</script>

<template>
  <button
    type="button"
    data-cy="date-badge"
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    :class="formatted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
    :aria-label="formatted ? `Échéance : ${formatted}. Cliquer pour modifier.` : 'Définir une échéance'"
  >
    <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
    {{ formatted ?? 'Date' }}
  </button>
</template>
