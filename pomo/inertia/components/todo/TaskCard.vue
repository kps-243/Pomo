<script setup lang="ts">
import { computed, ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import TaskModal from './TaskModal.vue'
import type { TaskItem } from '~/types/todo'

const props = defineProps<{
  task: TaskItem
}>()

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}

const initials = (firstName: string, lastName: string) =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

const assignees = computed(() => props.task.assignees ?? [])
</script>

<template>
  <div>
    <button
      type="button"
      class="group flex w-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-green-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      @click="openModal"
    >
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-sm font-medium text-gray-800 group-hover:text-green-700">
          {{ task.title }}
        </h4>
        <StatusBadge :status="task.status" class="shrink-0" />
      </div>

      <div class="flex min-h-7 items-center justify-end">
        <div v-if="assignees.length" class="flex items-center -space-x-2">
          <span
            v-for="(person, index) in assignees"
            :key="index"
            :title="`${person.firstName} ${person.lastName}`"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-[11px] font-semibold text-white ring-2 ring-white"
          >
            {{ initials(person.firstName, person.lastName) }}
          </span>
        </div>
      </div>
    </button>

    <TaskModal v-model:open="isModalOpen" :task="task" />
  </div>
</template>
