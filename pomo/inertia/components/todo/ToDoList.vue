<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { VueDraggable } from 'vue-draggable-plus'
import TaskCard from './TaskCard.vue'
import AddTaskCard from './AddTaskCard.vue'
import type { TaskItem, ToDoListItem } from '~/types/todo'

const props = defineProps<{
  list: ToDoListItem
}>()

const taskCount = computed(() => tasks.value.length)
const isEmpty = computed(() => taskCount.value === 0)

const tasks = ref<TaskItem[]>([...(props.list.tasks ?? [])])

watch(
  () => props.list.tasks,
  (nouvellesTasks) => {
    tasks.value = [...(nouvellesTasks ?? [])]
  }
)

const enregistrerOrdre = () => {
  router.put(
    `/todolists/${props.list.id}/tasks/reorder`,
    { taskIds: tasks.value.map((task) => task.id) },
    { preserveScroll: true, preserveState: true }
  )
}

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
      <div class="flex min-w-0 items-center gap-1.5">
        <UIcon
          v-if="list.groupId"
          name="i-heroicons-user-group"
          class="h-4 w-4 shrink-0 text-dimmed"
          title="Todolist partagée"
          aria-label="Todolist de groupe"
        />
        <h3 class="truncate text-base font-semibold text-primary">{{ list.name }}</h3>
      </div>

      <div class="relative flex shrink-0 items-center gap-2">
        <span
          class="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary-800 dark:text-primary-300"
        >
          {{ taskCount }}
        </span>

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

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <VueDraggable
        v-model="tasks"
        class="space-y-3"
        :animation="150"
        :delay="150"
        :delay-on-touch-only="true"
        :force-fallback="true"
        ghost-class="opacity-40"
        drag-class="rotate-2"
        @end="enregistrerOrdre"
      >
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :list-name="list.name"
          :is-group-list="list.groupId !== null"
        />
      </VueDraggable>
      <p v-if="!taskCount" class="px-1 py-6 text-center text-xs text-dimmed">
        Aucune task pour le moment.
      </p>
    </div>

    <footer class="border-t border-default px-3 py-3">
      <AddTaskCard :to-do-list-id="list.id" />
    </footer>
  </section>
</template>
