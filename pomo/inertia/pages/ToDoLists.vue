<script setup lang="ts">
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import ToDoList from '~/components/todo/ToDoList.vue'
import type { ToDoListItem } from '~/types/todo'

defineProps<{
  toDoLists: ToDoListItem[]
}>()

// TODO: implémenter la création d'une nouvelle task plus tard.
const onAddTask = (toDoListId: number) => {
  console.info('Ajout d’une task à la todolist', toDoListId)
}
</script>

<template>
  <DashboardLayout>
    <div class="flex h-full flex-col gap-4">
      <h1 class="text-xl font-bold text-green-600 sm:text-2xl">Mes ToDoLists</h1>

      <div class="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        <ToDoList
          v-for="list in toDoLists"
          :key="list.id"
          :list="list"
          class="w-[85vw] max-w-xs shrink-0 snap-start sm:w-72 md:w-80"
          @add-task="onAddTask"
        />

        <p v-if="!toDoLists.length" class="text-sm text-gray-400">
          Aucune todolist pour le moment.
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>
