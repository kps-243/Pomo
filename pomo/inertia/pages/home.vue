<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CardTitle from '../components/CardTitle.vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { computed } from "vue"

const props = defineProps<{
  tasks: {
    id: number
    title: string
    description: string
    status: string
    startDate: string
    duration: number
  }[]
}>()

// to improve: parse tasks in the controller and send them ready for the calendar
const tasksParsed = computed(() => {
  return props.tasks.map(task => {
    const start = new Date(task.startDate)

    return {
      start: start,
      end: new Date(start.getTime() + task.duration * 60000),
      title: task.title,
      content: task.description,
      class: task.status
    }
  })
})
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col lg:flex-row gap-6 w-full mt-6">
      <UCard class="w-full lg:w-1/2 flex flex-col border border-green-500 rounded-2xl shadow-md ring-0">
        <template #header>
          <CardTitle title="Calendar" />
        </template>
        <vue-cal
          class: task.status
          style="height: 256px"
          hide-view-selector
          :events="tasksParsed"
          time-at-cursor
          xsmall>
        </vue-cal>
      </UCard>
      <UCard class="w-full lg:w-1/2 border border-green-500 rounded-2xl shadow-md ring-0">
        <template #header>
          <CardTitle title="Tasks" />
        </template>
        <div class="divide-y">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center justify-between py-3"
            :class="{ 'opacity-60': task.status === 'done' }"
          >
            <div class="flex flex-col">
              <span class="font-medium text-gray-800">
                {{ task.title }}
              </span>
              <span class="text-sm text-gray-500">
                ⏱ {{ task.duration }} min
              </span>
            </div>
            <UBadge
              :color="task.status === 'done' ? 'green' : 'orange'"
              variant="soft"
              class="capitalize"
            >
              {{ task.status }}
            </UBadge>
          
          </div>
        
        </div>
      
      </UCard>
    </div>
  </DashboardLayout>
</template>