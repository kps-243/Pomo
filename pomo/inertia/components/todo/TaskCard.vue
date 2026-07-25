<script setup lang="ts">
import { computed, ref } from 'vue'
import StatusBadge from './StatusBadge.vue'
import DateBadge from './DateBadge.vue'
import TaskModal from './TaskModal.vue'
import MemberAvatar from './MemberAvatar.vue'
import type { TaskItem } from '~/types/todo'

const props = defineProps<{
  task: TaskItem
  listName: string
  isGroupList: boolean
}>()

const isModalOpen = ref(false)

const openModal = () => {
  isModalOpen.value = true
}

const members = computed(() => props.task.members ?? [])
</script>

<template>
  <div>
    <div
      role="button"
      tabindex="0"
      data-cy="task-card"
      class="group flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-default bg-default p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      @click="openModal"
      @keydown.enter="openModal"
      @keydown.space.prevent="openModal"
    >
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-sm font-medium text-highlighted group-hover:text-primary">
          {{ task.title }}
        </h4>
        <StatusBadge :status="task.status" :task-id="task.id" class="shrink-0" />
      </div>

      <div class="flex min-h-7 items-center justify-between gap-2">
        <div>
          <DateBadge v-if="task.dueDate" :due-date="task.dueDate" class="shrink-0" />
        </div>
        <div v-if="members.length" class="flex shrink-0 items-center -space-x-2">
          <MemberAvatar v-for="member in members" :key="member.id" :member="member" />
        </div>
      </div>
    </div>

    <TaskModal
      v-model:open="isModalOpen"
      :task="task"
      :list-name="listName"
      :is-group-list="isGroupList"
    />
  </div>
</template>
