<script setup lang="ts">
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import TaskCard from './TaskCard.vue'
import AddTaskCard from './AddTaskCard.vue'
import type { ToDoListItem } from '~/types/todo'

const props = defineProps<{
  list: ToDoListItem
}>()

const taskCount = computed(() => props.list.tasks?.length ?? 0)
const isEmpty = computed(() => taskCount.value === 0)

const confirmingDelete = ref(false)

const deleteList = () => {
  router.delete(`/todolists/${props.list.id}`, {
    preserveScroll: true,
    onSuccess: () => {
      confirmingDelete.value = false
    },
  })
}
</script>

<template>
  <section
    class="flex max-h-full w-full flex-col rounded-2xl border border-green-500 bg-gray-50 shadow-md"
  >
    <header class="flex items-center justify-between gap-2 border-b border-green-100 px-4 py-3">
      <h3 class="truncate text-base font-semibold text-green-600">{{ list.name }}</h3>

      <div class="relative flex shrink-0 items-center gap-2">
        <span
          class="flex h-6 min-w-6 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-700"
        >
          {{ taskCount }}
        </span>

        <!-- Poubelle : active uniquement si la liste est vide -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
          :disabled="!isEmpty"
          :title="isEmpty ? 'Supprimer la liste' : 'Videz la liste avant de la supprimer'"
          aria-label="Supprimer la liste"
          @click="confirmingDelete = true"
        >
          <UIcon name="i-heroicons-trash" class="h-4 w-4" />
        </button>

        <!-- Popover de confirmation -->
        <div
          v-if="confirmingDelete"
          class="absolute right-0 top-9 z-10 w-56 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg"
        >
          <p class="text-sm font-medium text-gray-700">Supprimer cette liste ?</p>
          <p class="mt-1 text-xs text-gray-500">La liste est vide, cette action est définitive.</p>
          <div class="mt-3 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
              @click="confirmingDelete = false"
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
              @click="deleteList"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <TaskCard
        v-for="task in list.tasks"
        :key="task.id"
        :task="task"
        :list-name="list.name"
      />
      <p v-if="!taskCount" class="px-1 py-6 text-center text-xs text-gray-400">
        Aucune task pour le moment.
      </p>
    </div>

    <footer class="border-t border-green-100 px-3 py-3">
      <AddTaskCard :to-do-list-id="list.id" />
    </footer>
  </section>
</template>
