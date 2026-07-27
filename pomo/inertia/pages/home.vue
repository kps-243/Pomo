<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CardTitle from '../components/CardTitle.vue'
import SyncCalendarModal from '../components/calendar/SyncCalendarModal.vue'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { computed, ref } from 'vue'
import { useForm } from '@inertiajs/vue3'

const props = defineProps<{
  tasks: {
    id: number
    title: string
    description: string
    status: string
    dueDate: string | null
    duration: number
  }[]
  toDoLists: { id: number; name: string }[]
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

// --- Création de tâche depuis le calendrier perso ---
const isEventModalOpen = ref(false)
const selectedListId = ref<number | null>(props.toDoLists[0]?.id ?? null)

const eventForm = useForm({
  title: '',
  due_date: '',
  duration: 60,
  description: '',
})

const pad = (n: number) => String(n).padStart(2, '0')

const toDatetimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

const onCellClick = (date: Date) => {
  eventForm.reset()
  eventForm.due_date = toDatetimeLocal(date)
  eventForm.duration = 60
  selectedListId.value = props.toDoLists[0]?.id ?? null
  isEventModalOpen.value = true
}

const submitEvent = () => {
  if (!selectedListId.value) return
  eventForm.post(`/todolists/${selectedListId.value}/tasks`, {
    preserveScroll: true,
    onSuccess: () => {
      isEventModalOpen.value = false
      eventForm.reset()
    },
  })
}
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
          @cell-click="onCellClick"
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

    <!-- Modal création de tâche depuis le calendrier perso -->
    <UModal v-model:open="isEventModalOpen" title="Nouvelle tâche" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-4 text-base font-semibold text-highlighted">Nouvelle tâche</h2>

          <form v-if="toDoLists.length" class="space-y-4" @submit.prevent="submitEvent">
            <div>
              <label for="event-title" class="mb-1 block text-sm font-medium text-toned"
                >Titre *</label
              >
              <input
                id="event-title"
                v-model="eventForm.title"
                type="text"
                placeholder="Nom de la tâche"
                autofocus
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p v-if="eventForm.errors.title" class="mt-1 text-xs text-error">
                {{ eventForm.errors.title }}
              </p>
            </div>

            <div>
              <label for="event-list" class="mb-1 block text-sm font-medium text-toned"
                >Liste *</label
              >
              <select
                id="event-list"
                v-model="selectedListId"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option v-for="list in toDoLists" :key="list.id" :value="list.id">
                  {{ list.name }}
                </option>
              </select>
            </div>

            <div>
              <label for="event-date" class="mb-1 block text-sm font-medium text-toned"
                >Date et heure</label
              >
              <input
                id="event-date"
                v-model="eventForm.due_date"
                type="datetime-local"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label for="event-duration" class="mb-1 block text-sm font-medium text-toned">
                Durée (minutes)
              </label>
              <input
                id="event-duration"
                v-model.number="eventForm.duration"
                type="number"
                min="5"
                step="5"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label for="event-description" class="mb-1 block text-sm font-medium text-toned">
                Description
              </label>
              <textarea
                id="event-description"
                v-model="eventForm.description"
                rows="2"
                placeholder="Optionnel..."
                class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <UButton type="button" color="neutral" variant="ghost" @click="isEventModalOpen = false">
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="eventForm.processing"
                :disabled="!eventForm.title.trim() || !selectedListId"
              >
                Créer
              </UButton>
            </div>
          </form>

          <p v-else class="text-sm text-muted">
            Crée d'abord une todolist personnelle pour pouvoir y ajouter des tâches depuis le
            calendrier.
          </p>
        </div>
      </template>
    </UModal>

    <SyncCalendarModal v-model:open="isSyncModalOpen" :feed-url="calendarFeedUrl" />
  </DashboardLayout>
</template>
