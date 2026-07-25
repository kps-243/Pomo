<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import ToDoList from '~/components/todo/ToDoList.vue'
import AddTodoListCard from '~/components/todo/AddTodoListCard.vue'
import type { ToDoListItem } from '~/types/todo'

const props = defineProps<{
  toDoLists: ToDoListItem[]
}>()

// Filtre d'affichage : todolists perso, partagées (de groupe) ou les deux.
type FilterValue = 'all' | 'personal' | 'shared'

const filter = ref<FilterValue>('all')

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'personal', label: 'Perso' },
  { value: 'shared', label: 'Partagées' },
]

const filteredLists = computed(() => {
  if (filter.value === 'personal') return props.toDoLists.filter((list) => list.groupId === null)
  if (filter.value === 'shared') return props.toDoLists.filter((list) => list.groupId !== null)
  return props.toDoLists
})
</script>

<template>
  <DashboardLayout>
    <div class="flex h-full flex-col gap-4">
      <!-- Titre (gauche) + filtre & ajout d'une todolist (droite), façon Trello -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <h1 class="text-xl font-bold text-primary sm:text-2xl">Mes ToDoLists</h1>

        <div class="flex flex-wrap items-start gap-3">
          <!-- Filtre perso / partagées / les deux -->
          <div class="inline-flex items-center gap-1 rounded-lg border border-default bg-muted p-1">
            <button
              v-for="option in filterOptions"
              :key="option.value"
              type="button"
              class="rounded-md px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="
                filter === option.value
                  ? 'bg-primary text-inverted'
                  : 'text-muted hover:bg-elevated hover:text-toned'
              "
              @click="filter = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <AddTodoListCard />
        </div>
      </div>

      <div class="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        <ToDoList
          v-for="list in filteredLists"
          :key="list.id"
          :list="list"
          class="w-[85vw] max-w-xs shrink-0 snap-start sm:w-72 md:w-80"
        />

        <p v-if="!filteredLists.length" class="text-sm text-muted">
          {{
            toDoLists.length
              ? 'Aucune todolist dans cette catégorie.'
              : 'Aucune todolist pour le moment.'
          }}
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>
