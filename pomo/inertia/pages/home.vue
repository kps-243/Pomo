<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CardTitle from '../components/CardTitle.vue'
import SyncCalendarModal from '../components/calendar/SyncCalendarModal.vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { computed, ref } from 'vue'

const props = defineProps<{
  tasks: {
    id: number
    title: string
    description: string
    status: string
    dueDate: string | null
    duration: number
  }[]
  calendarFeedUrl: string
}>()

const isSyncModalOpen = ref(false)

const tasksParsed = computed(() =>
  props.tasks
    .filter((task) => task.dueDate)
    .map((task) => {
      const start = new Date(task.dueDate as string)
      return {
        start,
        end: new Date(start.getTime() + 60000),
        title: task.title,
        content: task.description,
        class: `task-marker ${task.status}`,
      }
    })
)
</script>

<template>
  <DashboardLayout>
    <div class="mt-6 flex w-full flex-col gap-6 lg:flex-row">
      <UCard
        class="flex w-full flex-col rounded-2xl border border-default shadow-md ring-0 lg:w-1/2"
      >
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <CardTitle title="Calendar" />
            <UButton
              icon="i-heroicons-arrow-path"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="isSyncModalOpen = true"
            >
              Synchroniser
            </UButton>
          </div>
        </template>
        <vue-cal
          style="height: 400px"
          default-view="week"
          hide-view-selector
          :events="tasksParsed"
          time-at-cursor
          xsmall
        />
      </UCard>

      <UCard class="w-full rounded-2xl border border-default shadow-md ring-0 lg:w-1/2">
        <template #header>
          <CardTitle title="Tasks" />
        </template>
        <div class="divide-y divide-default">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center justify-between py-3"
            :class="{ 'opacity-60': task.status === 'done' }"
          >
            <div class="flex flex-col">
              <span class="font-medium text-highlighted">{{ task.title }}</span>
              <span class="text-sm text-muted">⏱ {{ task.duration }} min</span>
            </div>
            <UBadge
              :color="task.status === 'done' ? 'success' : 'warning'"
              variant="soft"
              class="capitalize"
            >
              {{ task.status }}
            </UBadge>
          </div>

          <p v-if="!tasks.length" class="py-3 text-sm text-muted">Aucune tâche pour le moment.</p>
        </div>
      </UCard>
    </div>

    <SyncCalendarModal v-model:open="isSyncModalOpen" :feed-url="calendarFeedUrl" />
  </DashboardLayout>
</template>
