<script setup lang="ts">
import { computed, ref } from 'vue'
import { Head } from '@inertiajs/vue3'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import EventModal from '~/components/calendar/EventModal.vue'
import AddToCalendarModal from '~/components/calendar/AddToCalendarModal.vue'
import EmptyState from '~/components/EmptyState.vue'
import { canManageItem, eventEndIso } from '~/utils/calendar'
import { formatDateRangeShort } from '~/utils/date'
import type { CalendarEvent } from '~/types/calendar'

const props = defineProps<{
  currentUserId: number
  events: CalendarEvent[]
  groups: { id: number; name: string; isOwner: boolean }[]
  toDoLists: { id: number; name: string }[]
}>()

const timeFilters = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passés' },
  { value: 'all', label: 'Tous' },
] as const

const timeFilter = ref<'upcoming' | 'past' | 'all'>('upcoming')
const groupFilter = ref<'all' | 'personal' | number>('all')

const now = Date.now()
const isPast = (event: CalendarEvent) => new Date(event.endDate ?? event.startDate).getTime() < now

const filteredEvents = computed(() =>
  props.events.filter((event) => {
    if (timeFilter.value === 'upcoming' && isPast(event)) return false
    if (timeFilter.value === 'past' && !isPast(event)) return false
    if (groupFilter.value === 'personal' && event.groupId !== null) return false
    if (typeof groupFilter.value === 'number' && event.groupId !== groupFilter.value) return false
    return true
  })
)

const isAddModalOpen = ref(false)
const selectedEventId = ref<number | null>(null)
const isEventModalOpen = ref(false)

const selectedEvent = computed(
  () => props.events.find((event) => event.id === selectedEventId.value) ?? null
)

const canManageSelectedEvent = computed(() => {
  const event = selectedEvent.value
  if (!event) return false
  const group = props.groups.find((candidate) => candidate.id === event.groupId)
  return canManageItem(event.createdBy, props.currentUserId, group?.isOwner ?? false)
})

const openEvent = (event: CalendarEvent) => {
  selectedEventId.value = event.id
  isEventModalOpen.value = true
}
</script>

<template>
  <Head title="Mes évènements" />
  <DashboardLayout>
    <div class="flex flex-col gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-primary sm:text-2xl">Mes évènements</h1>
        <UButton icon="i-heroicons-plus" color="primary" @click="isAddModalOpen = true">
          Nouvel évènement
        </UButton>
      </div>

      <!-- Filtres -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex rounded-lg border border-default p-0.5">
          <button
            v-for="option in timeFilters"
            :key="option.value"
            type="button"
            class="rounded-md px-3 py-1 text-sm transition"
            :class="
              timeFilter === option.value
                ? 'bg-primary text-inverted'
                : 'text-toned hover:bg-elevated'
            "
            @click="timeFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <select
          v-model="groupFilter"
          class="rounded-lg border border-accented bg-default px-3 py-1.5 text-sm text-default focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">Tous les groupes</option>
          <option value="personal">Perso</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <!-- Liste -->
      <div v-if="filteredEvents.length" class="flex flex-col gap-3">
        <button
          v-for="event in filteredEvents"
          :key="event.id"
          type="button"
          class="flex items-start gap-3 rounded-2xl border border-default bg-default p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="openEvent(event)"
        >
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info"
          >
            <UIcon name="i-heroicons-calendar-days" class="h-5 w-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-highlighted">{{ event.title }}</p>
            <p class="text-sm text-muted">
              {{ formatDateRangeShort(event.startDate, eventEndIso(event)) }}
            </p>
            <p v-if="event.location" class="flex items-center gap-1 text-xs text-dimmed">
              <UIcon name="i-heroicons-map-pin" class="h-3 w-3" />
              {{ event.location }}
            </p>
          </div>
          <span
            v-if="event.groupName"
            class="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-xs text-toned"
          >
            {{ event.groupName }}
          </span>
        </button>
      </div>

      <EmptyState
        v-else
        icon="i-heroicons-calendar-days"
        title="Aucun évènement"
        description="Créez votre premier évènement avec le bouton ci-dessus."
      />
    </div>

    <AddToCalendarModal v-model:open="isAddModalOpen" :to-do-lists="toDoLists" :groups="groups" />

    <EventModal
      v-if="selectedEvent"
      v-model:open="isEventModalOpen"
      :event="selectedEvent"
      :can-manage="canManageSelectedEvent"
    />
  </DashboardLayout>
</template>
