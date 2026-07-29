<script setup lang="ts">
import { computed } from 'vue'
import { Head, Link } from '@inertiajs/vue3'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { toCalendarEntries, eventEndIso } from '~/utils/calendar'
import { formatDateRangeShort } from '~/utils/date'
import type { CalendarEvent, CalendarTask } from '~/types/calendar'
import EmptyState from '~/components/EmptyState.vue'

const props = defineProps<{
  currentUserId: number
  tasks: CalendarTask[]
  events: CalendarEvent[]
  toDoLists: { id: number; name: string }[]
  groups: { id: number; name: string; isOwner: boolean }[]
  calendarFeedUrl: string
}>()

const entries = computed(() => toCalendarEntries(props.tasks, props.events))

const now = Date.now()
const upcomingEvents = computed(() =>
  props.events
    .filter((event) => new Date(event.endDate ?? event.startDate).getTime() >= now)
    .slice(0, 3)
)

const activeTasks = computed(() => props.tasks.filter((task) => task.status !== 'done').slice(0, 4))
</script>

<template>
  <Head title="Mon dashboard" />
  <DashboardLayout>
    <div class="flex flex-col gap-6">
      <h1 class="text-xl font-bold text-primary sm:text-2xl">Mon dashboard</h1>

      <div class="grid gap-5 lg:grid-cols-2">
        <!-- Calendrier -->
        <div class="flex flex-col rounded-2xl border border-default bg-default p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon name="i-heroicons-calendar-days" class="h-5 w-5 text-primary" />
              Calendrier
            </h2>
            <Link href="/calendar" class="text-sm font-medium text-primary hover:underline">
              Ouvrir →
            </Link>
          </div>
          <div class="min-h-0 flex-1">
            <vue-cal
              style="height: 260px"
              locale="fr"
              default-view="month"
              hide-view-selector
              events-on-month-view="short"
              xsmall
              :events="entries"
            />
          </div>
        </div>

        <!-- Évènements -->
        <Link
          href="/events"
          class="flex flex-col rounded-2xl border border-default bg-default p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon name="i-heroicons-sparkles" class="h-5 w-5 text-primary" />
              Évènements à venir
            </h2>
            <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-dimmed" />
          </div>
          <div v-if="upcomingEvents.length" class="flex flex-col gap-2">
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="rounded-lg bg-elevated/60 px-3 py-2"
            >
              <p class="truncate text-sm font-medium text-highlighted">{{ event.title }}</p>
              <p class="text-xs text-muted">
                {{ formatDateRangeShort(event.startDate, eventEndIso(event)) }}
              </p>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            icon="i-heroicons-sparkles"
            title="Aucun évènement à venir"
            class="m-auto"
          />
        </Link>

        <!-- To-do lists -->
        <Link
          href="/todolists"
          class="flex flex-col rounded-2xl border border-default bg-default p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon name="i-heroicons-view-columns" class="h-5 w-5 text-primary" />
              Tâches à venir
            </h2>
            <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-dimmed" />
          </div>
          <div v-if="activeTasks.length" class="flex flex-col gap-2">
            <div
              v-for="task in activeTasks"
              :key="task.id"
              class="flex items-center gap-2 rounded-lg bg-elevated/60 px-3 py-2"
            >
              <span class="h-2 w-2 shrink-0 rounded-full bg-primary"></span>
              <p class="truncate text-sm text-default">{{ task.title }}</p>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            icon="i-heroicons-view-columns"
            title="Aucune tâche en cours"
            class="m-auto"
          />
        </Link>

        <!-- Groupes -->
        <Link
          href="/groups"
          class="flex flex-col rounded-2xl border border-default bg-default p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold text-highlighted">
              <UIcon name="i-heroicons-user-group" class="h-5 w-5 text-primary" />
              Groupes
            </h2>
            <UIcon name="i-heroicons-arrow-right" class="h-4 w-4 text-dimmed" />
          </div>
          <div v-if="groups.length" class="flex flex-col gap-2">
            <div
              v-for="group in groups.slice(0, 4)"
              :key="group.id"
              class="flex items-center gap-2 rounded-lg bg-elevated/60 px-3 py-2"
            >
              <UIcon name="i-heroicons-user-group" class="h-4 w-4 text-secondary" />
              <p class="truncate text-sm text-default">{{ group.name }}</p>
            </div>
          </div>
          <EmptyState
            v-else
            compact
            icon="i-heroicons-user-group"
            title="Aucun groupe"
            class="m-auto"
          />
        </Link>
      </div>
    </div>
  </DashboardLayout>
</template>
