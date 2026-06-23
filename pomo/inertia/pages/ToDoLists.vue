<script setup lang="ts">
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import ToDoList from '~/components/todo/ToDoList.vue'
import AddTodoListCard from '~/components/todo/AddTodoListCard.vue'
import type { ToDoListItem } from '~/types/todo'

defineProps<{
  toDoLists: ToDoListItem[]
}>()
</script>

<template>
  <DashboardLayout>
    <div class="flex h-full flex-col gap-4">
      <!-- Titre (gauche) + ajout d'une todolist (droite), façon Trello -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <h1 class="text-xl font-bold text-green-600 sm:text-2xl">Mes ToDoLists</h1>
        <AddTodoListCard />
      </div>

      <div class="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        <ToDoList
          v-for="list in toDoLists"
          :key="list.id"
          :list="list"
          class="w-[85vw] max-w-xs shrink-0 snap-start sm:w-72 md:w-80"
        />

        <p v-if="!toDoLists.length" class="text-sm text-gray-400">
          Aucune todolist pour le moment.
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>
