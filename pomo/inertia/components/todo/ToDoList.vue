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
    class="flex max-h-full w-full flex-col rounded-2xl border border-default bg-muted shadow-md"
  >
    <header class="flex items-center justify-between gap-2 border-b border-default px-4 py-3">
      <h3 class="truncate text-base font-semibold text-primary">{{ list.name }}</h3>

      <div class="relative flex shrink-0 items-center gap-2">
        <span
          class="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary-800 dark:text-primary-300"
        >
          {{ taskCount }}
        </span>

        <!-- Poubelle : active uniquement si la liste est vide -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-dimmed transition hover:bg-error/10 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-dimmed"
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
          class="absolute right-0 top-9 z-10 w-56 rounded-lg border border-default bg-default p-3 text-left shadow-lg"
        >
          <p class="text-sm font-medium text-toned">Supprimer cette liste ?</p>
          <p class="mt-1 text-xs text-muted">La liste est vide, cette action est définitive.</p>
          <div class="mt-3 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-elevated"
              @click="confirmingDelete = false"
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded-md bg-error px-2 py-1 text-xs font-semibold text-inverted transition hover:bg-error/90"
              @click="deleteList"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 space-y-3 overflow-y-auto px-3 py-3">
      <TaskCard v-for="task in list.tasks" :key="task.id" :task="task" :list-name="list.name" />
      <p v-if="!taskCount" class="px-1 py-6 text-center text-xs text-dimmed">
        Aucune task pour le moment.
      </p>
    </div>

    <footer class="border-t border-default px-3 py-3">
      <AddTaskCard :to-do-list-id="list.id" />
    </footer>
  </section>
</template>
