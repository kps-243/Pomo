<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CalendarBoard from '~/components/calendar/CalendarBoard.vue'
import type { CalendarEvent, CalendarTask } from '~/types/calendar'

const props = defineProps<{
  currentUserId: number
  tasks: CalendarTask[]
  events: CalendarEvent[]
  toDoLists: { id: number; name: string }[]
  groups: { id: number; name: string; isOwner: boolean }[]
  calendarFeedUrl: string
}>()
</script>

<template>
  <Head title="Mon calendrier" />
  <DashboardLayout>
    <div class="flex h-full flex-col gap-4">
      <h1 class="text-xl font-bold text-primary sm:text-2xl">Mon calendrier</h1>
      <div class="min-h-0 flex-1">
        <CalendarBoard v-bind="props" :show-agenda="false" />
      </div>
    </div>
  </DashboardLayout>
</template>
