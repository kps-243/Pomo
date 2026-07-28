<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import CalendarPicker from '~/components/todo/CalendarPicker.vue'
import ListBadge from '~/components/todo/ListBadge.vue'
import { eventEndIso, calendarLabel } from '~/utils/calendar'
import {
  durationInMinutes,
  formatDateRangeShort,
  formatDurationShort,
  formatDueDateShort,
} from '~/utils/date'
import type { CalendarEvent } from '~/types/calendar'

const props = defineProps<{
  event: CalendarEvent
  canManage: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const form = useForm({
  title: props.event.title,
  description: props.event.description ?? '',
  location: props.event.location ?? '',
  start_date: props.event.startDate,
  end_date: eventEndIso(props.event),
})

const resetForm = () => {
  form.defaults({
    title: props.event.title,
    description: props.event.description ?? '',
    location: props.event.location ?? '',
    start_date: props.event.startDate,
    end_date: eventEndIso(props.event),
  })
  form.reset()
  form.clearErrors()
}

watch(() => props.event, resetForm)

const save = () => {
  form.put(`/events/${props.event.id}`, { preserveScroll: true })
}

const saveTitle = () => {
  const title = form.title.trim()
  if (title === '' || title === props.event.title) {
    form.title = props.event.title
    return
  }
  save()
}

const saveDescription = () => {
  if (form.description === (props.event.description ?? '')) return
  save()
}

const saveLocation = () => {
  if (form.location === (props.event.location ?? '')) return
  save()
}

const blurOnEnter = (event: KeyboardEvent) => (event.target as HTMLInputElement).blur()

// Édition des dates : un seul picker à la fois, sur le début ou sur la fin.
const isCalendarOpen = ref(false)
const editedBound = ref<'start' | 'end'>('start')
const startDraft = ref(props.event.startDate)
const endDraft = ref(eventEndIso(props.event))

const draft = computed({
  get: () => (editedBound.value === 'start' ? startDraft.value : endDraft.value),
  set: (value: string | null) => {
    if (!value) return
    if (editedBound.value === 'start') {
      // Déplacer le début décale la fin d'autant : la durée est préservée.
      const shift = new Date(value).getTime() - new Date(startDraft.value).getTime()
      startDraft.value = value
      endDraft.value = new Date(new Date(endDraft.value).getTime() + shift).toISOString()
    } else {
      endDraft.value = value
    }
  },
})

const openCalendar = (bound: 'start' | 'end') => {
  startDraft.value = props.event.startDate
  endDraft.value = eventEndIso(props.event)
  editedBound.value = bound
  isCalendarOpen.value = true
}

const toggleCalendar = () => {
  if (isCalendarOpen.value) {
    isCalendarOpen.value = false
    return
  }
  openCalendar('start')
}

const invalidRange = computed(() => new Date(endDraft.value) <= new Date(startDraft.value))

const saveDates = () => {
  if (invalidRange.value) return
  form.start_date = startDraft.value
  form.end_date = endDraft.value
  form.put(`/events/${props.event.id}`, {
    preserveScroll: true,
    onSuccess: () => (isCalendarOpen.value = false),
  })
}

const range = computed(() => formatDateRangeShort(props.event.startDate, eventEndIso(props.event)))
const duration = computed(() =>
  formatDurationShort(durationInMinutes(props.event.startDate, eventEndIso(props.event)))
)

const confirmingDelete = ref(false)

watch(open, (isOpen) => {
  if (isOpen) {
    resetForm()
    return
  }
  confirmingDelete.value = false
  isCalendarOpen.value = false
})

const deleteEvent = () => {
  router.delete(`/events/${props.event.id}`, {
    preserveScroll: true,
    onSuccess: () => {
      confirmingDelete.value = false
      open.value = false
    },
  })
}

const close = () => {
  confirmingDelete.value = false
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="event.title" scrollable :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <div data-cy="event-modal" class="flex max-h-[85vh] flex-col">
        <header
          class="flex items-start justify-between gap-3 border-b border-default px-4 py-3 sm:px-6"
        >
          <div class="min-w-0 flex-1">
            <input
              v-model="form.title"
              :readonly="!canManage"
              class="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold text-highlighted transition read-only:cursor-default hover:bg-elevated read-only:hover:bg-transparent focus:border-primary focus:bg-default focus:outline-none"
              @blur="saveTitle"
              @keyup.enter="blurOnEnter"
            />
            <p v-if="form.errors.title" class="mt-1 px-1 text-xs text-error">
              {{ form.errors.title }}
            </p>
            <div class="ml-1 mt-1.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-cy="event-range-badge"
                class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-800 transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary-300"
                :disabled="!canManage"
                @click="toggleCalendar"
              >
                <UIcon name="i-heroicons-calendar-days" class="h-3.5 w-3.5" />
                {{ range }}
              </button>
              <span
                class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-toned"
              >
                <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                {{ duration }}
              </span>
              <ListBadge :name="calendarLabel(event.groupName)" />
            </div>
            <p v-if="event.createdBy" class="ml-1 mt-1.5 text-xs text-dimmed">
              Créé par {{ event.createdBy.firstName }} {{ event.createdBy.lastName }}
            </p>
          </div>

          <div class="relative flex shrink-0 items-center gap-1">
            <button
              v-if="canManage"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-md text-dimmed transition hover:bg-error/10 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
              aria-label="Supprimer l'évènement"
              @click="confirmingDelete = true"
            >
              <UIcon name="i-heroicons-trash" class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-md text-dimmed transition hover:bg-elevated hover:text-toned focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Fermer"
              @click="close"
            >
              <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
            </button>

            <div
              v-if="confirmingDelete"
              class="absolute right-0 top-10 z-10 w-56 rounded-lg border border-default bg-default p-3 text-left shadow-lg"
            >
              <p class="text-sm font-medium text-toned">Supprimer cet évènement ?</p>
              <p class="mt-1 text-xs text-muted">Cette action est définitive.</p>
              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-elevated"
                  @click="confirmingDelete = false"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  class="rounded-md bg-error px-2 py-1 text-xs font-semibold text-inverted transition hover:bg-error/90"
                  @click="deleteEvent"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </header>

        <div class="space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          <section v-if="isCalendarOpen">
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
              Dates
            </h3>

            <div class="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-lg border px-3 py-2 text-left text-xs transition"
                :class="
                  editedBound === 'start'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-default text-toned hover:bg-elevated'
                "
                @click="editedBound = 'start'"
              >
                <span class="block font-semibold uppercase tracking-wide">Début</span>
                <span class="mt-0.5 block">{{ formatDueDateShort(startDraft) }}</span>
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-2 text-left text-xs transition"
                :class="
                  editedBound === 'end'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-default text-toned hover:bg-elevated'
                "
                @click="editedBound = 'end'"
              >
                <span class="block font-semibold uppercase tracking-wide">Fin</span>
                <span class="mt-0.5 block">{{ formatDueDateShort(endDraft) }}</span>
              </button>
            </div>

            <CalendarPicker v-model="draft" hide-actions />

            <p v-if="invalidRange" class="mt-2 text-xs text-error">
              La fin doit être postérieure au début.
            </p>

            <div class="mt-3 flex justify-end gap-2">
              <UButton type="button" color="neutral" variant="ghost" @click="isCalendarOpen = false">
                Annuler
              </UButton>
              <UButton
                type="button"
                color="primary"
                :loading="form.processing"
                :disabled="invalidRange"
                data-cy="save-event-dates"
                @click="saveDates"
              >
                Enregistrer
              </UButton>
            </div>
          </section>

          <section>
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              <UIcon name="i-heroicons-map-pin" class="h-4 w-4" />
              Lieu
            </h3>
            <input
              v-model="form.location"
              :readonly="!canManage"
              placeholder="Ajouter un lieu..."
              class="w-full rounded-lg border border-accented bg-muted px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @blur="saveLocation"
              @keyup.enter="blurOnEnter"
            />
          </section>

          <section>
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              <UIcon name="i-heroicons-bars-3-bottom-left" class="h-4 w-4" />
              Description
            </h3>
            <textarea
              v-model="form.description"
              rows="4"
              :readonly="!canManage"
              placeholder="Ajouter une description plus détaillée..."
              class="w-full resize-y rounded-lg border border-accented bg-muted px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @blur="saveDescription"
            />
          </section>
        </div>
      </div>
    </template>
  </UModal>
</template>
