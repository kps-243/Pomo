<script setup lang="ts">
import { computed } from 'vue'
import TaskCard from './TaskCard.vue'
import AddTaskCard from './AddTaskCard.vue'
import type { ToDoListItem } from '~/types/todo'

const props = defineProps<{
  list: ToDoListItem
}>()

const taskCount = computed(() => props.list.tasks?.length ?? 0)
</script>

<template>
  <section class="flex max-h-full w-full flex-col rounded-2xl border border-green-500 bg-gray-50 shadow-md">
    <header class="flex items-center justify-between gap-2 border-b border-green-100 px-4 py-3">
      <h3 class="truncate text-base font-semibold text-green-600">{{ list.name }}</h3>
      <span
        class="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-700"
      >
        {{ taskCount }}
      </span>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <TaskCard v-for="task in list.tasks" :key="task.id" :task="task" />
      <p v-if="!taskCount" class="px-1 py-6 text-center text-xs text-gray-400">
        Aucune task pour le moment.
      </p>
    </div>

    <footer class="border-t border-green-100 px-3 py-3">
      <AddTaskCard :to-do-list-id="list.id" />
    </footer>
  </section>
</template>
