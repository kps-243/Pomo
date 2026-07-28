<script setup lang="ts">
import { computed, ref } from 'vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CardTitle from '../components/CardTitle.vue'
import SyncCalendarModal from '../components/calendar/SyncCalendarModal.vue'
import AddToCalendarModal from '~/components/calendar/AddToCalendarModal.vue'
import AgendaList from '~/components/calendar/AgendaList.vue'
import EventModal from '~/components/calendar/EventModal.vue'
import TaskModal from '~/components/todo/TaskModal.vue'
import { buildAgenda, canManageItem, toCalendarEntries, visibleTimeRange } from '~/utils/calendar'
import type { AgendaItem, CalendarEvent, CalendarTask } from '~/types/calendar'

const props = defineProps<{
  currentUserId: number
  tasks: CalendarTask[]
  events: CalendarEvent[]
  toDoLists: { id: number; name: string }[]
  groups: { id: number; name: string; isOwner: boolean }[]
  calendarFeedUrl: string
}>()

const entries = computed(() => toCalendarEntries(props.tasks, props.events))
const agenda = computed(() => buildAgenda(props.tasks, props.events))
const timeRange = computed(() => visibleTimeRange(props.tasks, props.events))

const isSyncModalOpen = ref(false)

// Vue active du calendrier. En vue mois/année une cellule couvre un jour ou un
// mois entier : le clic doit seulement naviguer, pas ouvrir le modal de création.
const activeView = ref('week')
const canCreateFromCell = computed(() => activeView.value === 'week' || activeView.value === 'day')

const isAddModalOpen = ref(false)
const addDefaultDate = ref<string | null>(null)

const openAddModal = (date?: Date) => {
  addDefaultDate.value = date ? date.toISOString() : null
  isAddModalOpen.value = true
}

const selectedTaskId = ref<number | null>(null)
const selectedEventId = ref<number | null>(null)
const isTaskModalOpen = ref(false)
const isEventModalOpen = ref(false)

const selectedTask = computed(
  () => props.tasks.find((task) => task.id === selectedTaskId.value) ?? null
)
const selectedEvent = computed(
  () => props.events.find((event) => event.id === selectedEventId.value) ?? null
)

const canManageSelectedEvent = computed(() => {
  const event = selectedEvent.value
  if (!event) return false
  const group = props.groups.find((candidate) => candidate.id === event.groupId)
  return canManageItem(event.createdBy, props.currentUserId, group?.isOwner ?? false)
})

const openItem = (item: AgendaItem) => {
  if (item.kind === 'task') {
    selectedTaskId.value = item.task.id
    isTaskModalOpen.value = true
    return
  }
  selectedEventId.value = item.event.id
  isEventModalOpen.value = true
}

let entryJustClicked = false

const onEntryClick = (entry: { itemKey?: string }) => {
  entryJustClicked = true
  setTimeout(() => (entryJustClicked = false), 0)
  const item = agenda.value.find((candidate) => candidate.key === entry.itemKey)
  if (item) openItem(item)
}

const onCellClick = (date: Date) => {
  if (!canCreateFromCell.value || entryJustClicked) return
  openAddModal(date)
}
</script>

<template>
  <DashboardLayout>
    <div class="flex w-full flex-col gap-6 lg:h-full lg:flex-row">
      <UCard
        class="flex w-full flex-col overflow-hidden rounded-2xl border border-default shadow-md ring-0 lg:w-1/2"
        :ui="{ body: 'flex min-h-0 flex-1 flex-col' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <CardTitle title="Calendrier" />
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-plus"
                color="primary"
                variant="soft"
                size="xs"
                data-cy="add-to-calendar"
                @click="openAddModal()"
              >
                Ajouter
              </UButton>
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
          </div>
        </template>

        <div class="h-100 lg:h-auto lg:min-h-0 lg:flex-1">
          <vue-cal
            v-model:active-view="activeView"
            style="height: 100%"
            locale="fr"
            hide-view-selector
            :events="entries"
            :time-from="timeRange.from"
            :time-to="timeRange.to"
            time-at-cursor
            xsmall
            @cell-click="onCellClick"
            @event-click="onEntryClick"
          />
        </div>
      </UCard>

      <UCard
        class="flex w-full flex-col overflow-hidden rounded-2xl border border-default shadow-md ring-0 lg:w-1/2"
        :ui="{ body: 'min-h-0 flex-1 overflow-y-auto' }"
      >
        <template #header>
          <CardTitle title="Tâches et évènements" />
        </template>
        <AgendaList
          :items="agenda"
          empty-title="Rien de prévu"
          empty-description="Ajoutez une tâche ou un évènement depuis le calendrier."
          @select="openItem"
        />
      </UCard>
    </div>

    <AddToCalendarModal
      v-model:open="isAddModalOpen"
      :to-do-lists="toDoLists"
      :groups="groups"
      :default-date="addDefaultDate"
    />

    <TaskModal
      v-if="selectedTask"
      v-model:open="isTaskModalOpen"
      :task="selectedTask"
      :list-name="selectedTask.groupName ?? selectedTask.listName"
      :is-group-list="selectedTask.groupId !== null"
    />

    <EventModal
      v-if="selectedEvent"
      v-model:open="isEventModalOpen"
      :event="selectedEvent"
      :can-manage="canManageSelectedEvent"
    />

    <SyncCalendarModal v-model:open="isSyncModalOpen" :feed-url="calendarFeedUrl" />
  </DashboardLayout>
</template>
