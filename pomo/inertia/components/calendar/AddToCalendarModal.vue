<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from '@inertiajs/vue3'
import CalendarPicker from '~/components/todo/CalendarPicker.vue'
import { addMinutesToIso, formatDueDateShort } from '~/utils/date'

const props = withDefaults(
  defineProps<{
    toDoLists?: { id: number; name: string }[]
    groups?: { id: number; name: string }[]
    defaultDate?: string | null
    lockedGroupId?: number | null
  }>(),
  { toDoLists: () => [], groups: () => [], defaultDate: null, lockedGroupId: null }
)

const open = defineModel<boolean>('open', { default: false })

type Mode = 'task' | 'event'

const mode = ref<Mode>('task')
const targetGroupId = ref<number | null>(props.lockedGroupId)
const selectedListId = ref<number | null>(props.toDoLists[0]?.id ?? null)

const isGroupTarget = computed(() => targetGroupId.value !== null)
const canChooseTarget = computed(() => props.lockedGroupId === null && props.groups.length > 0)
const needsPersonalList = computed(() => mode.value === 'task' && !isGroupTarget.value)
const hasPersonalList = computed(() => props.toDoLists.length > 0)

const startOfNextHour = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() > 30 ? 60 : 30, 0, 0)
  return date.toISOString()
}

const taskForm = useForm<{ title: string; due_date: string | null; description: string }>({
  title: '',
  due_date: null,
  description: '',
})

const eventForm = useForm({
  title: '',
  start_date: '',
  end_date: '',
  location: '',
  description: '',
})

const editedBound = ref<'start' | 'end'>('start')

const eventDraft = computed({
  get: () => (editedBound.value === 'start' ? eventForm.start_date : eventForm.end_date),
  set: (value: string | null) => {
    if (!value) return
    if (editedBound.value === 'start') {
      // Déplacer le début décale la fin d'autant : la durée reste la même.
      const shift = new Date(value).getTime() - new Date(eventForm.start_date).getTime()
      eventForm.start_date = value
      eventForm.end_date = new Date(new Date(eventForm.end_date).getTime() + shift).toISOString()
    } else {
      eventForm.end_date = value
    }
  },
})

const invalidRange = computed(
  () => new Date(eventForm.end_date) <= new Date(eventForm.start_date)
)

const reset = () => {
  const start = props.defaultDate ?? startOfNextHour()
  taskForm.reset()
  taskForm.clearErrors()
  taskForm.due_date = start
  eventForm.reset()
  eventForm.clearErrors()
  eventForm.start_date = start
  eventForm.end_date = addMinutesToIso(start, 60)
  editedBound.value = 'start'
  targetGroupId.value = props.lockedGroupId
  selectedListId.value = props.toDoLists[0]?.id ?? null
}

watch(open, (isOpen) => {
  if (isOpen) reset()
})

const submitTask = () => {
  const url = isGroupTarget.value
    ? `/groups/${targetGroupId.value}/tasks`
    : `/todolists/${selectedListId.value}/tasks`
  taskForm.post(url, {
    preserveScroll: true,
    onSuccess: () => (open.value = false),
  })
}

const submitEvent = () => {
  if (invalidRange.value) return
  const url = isGroupTarget.value ? `/groups/${targetGroupId.value}/events` : '/events'
  eventForm.post(url, {
    preserveScroll: true,
    onSuccess: () => (open.value = false),
  })
}

const submit = () => (mode.value === 'task' ? submitTask() : submitEvent())

const processing = computed(() =>
  mode.value === 'task' ? taskForm.processing : eventForm.processing
)

const canSubmit = computed(() => {
  if (mode.value === 'task') {
    if (!taskForm.title.trim()) return false
    return isGroupTarget.value ? true : !!selectedListId.value
  }
  return !!eventForm.title.trim() && !invalidRange.value
})

const tabClass = (value: Mode) =>
  mode.value === value
    ? 'bg-default text-primary shadow-sm'
    : 'text-muted hover:text-toned bg-transparent'
</script>

<template>
  <UModal v-model:open="open" title="Ajouter au calendrier" :ui="{ content: 'sm:max-w-md' }">
    <template #content>
      <div data-cy="add-to-calendar-modal" class="flex max-h-[85vh] flex-col">
        <header class="border-b border-default px-5 py-4">
          <h2 class="text-base font-semibold text-highlighted">Ajouter au calendrier</h2>
          <div class="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-elevated p-1">
            <button
              type="button"
              data-cy="mode-task"
              class="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="tabClass('task')"
              @click="mode = 'task'"
            >
              <UIcon name="i-heroicons-check-circle" class="h-4 w-4" />
              Tâche
            </button>
            <button
              type="button"
              data-cy="mode-event"
              class="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="tabClass('event')"
              @click="mode = 'event'"
            >
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
              Évènement
            </button>
          </div>
          <p class="mt-2 text-xs text-muted">
            {{
              mode === 'task'
                ? 'Une tâche a une échéance, sans durée.'
                : 'Un évènement occupe un créneau, du début à la fin.'
            }}
          </p>
        </header>

        <form
          v-if="mode === 'event' || !needsPersonalList || hasPersonalList"
          class="flex min-h-0 flex-1 flex-col"
          @submit.prevent="submit"
        >
          <div class="space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label for="item-title" class="mb-1 block text-sm font-medium text-toned">
                Titre *
              </label>
              <input
                v-if="mode === 'task'"
                id="item-title"
                v-model="taskForm.title"
                type="text"
                placeholder="Nom de la tâche"
                autofocus
                data-cy="item-title"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <input
                v-else
                id="item-title"
                v-model="eventForm.title"
                type="text"
                placeholder="Nom de l'évènement"
                autofocus
                data-cy="item-title"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p
                v-if="taskForm.errors.title || eventForm.errors.title"
                class="mt-1 text-xs text-error"
              >
                {{ taskForm.errors.title || eventForm.errors.title }}
              </p>
            </div>

            <div v-if="canChooseTarget">
              <label for="item-calendar" class="mb-1 block text-sm font-medium text-toned">
                Calendrier
              </label>
              <select
                id="item-calendar"
                v-model="targetGroupId"
                data-cy="item-calendar"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option :value="null">Mon calendrier</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </div>

            <div v-if="needsPersonalList">
              <label for="item-list" class="mb-1 block text-sm font-medium text-toned">
                Liste *
              </label>
              <select
                id="item-list"
                v-model="selectedListId"
                data-cy="item-list"
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option v-for="list in toDoLists" :key="list.id" :value="list.id">
                  {{ list.name }}
                </option>
              </select>
            </div>

            <div v-if="mode === 'task'">
              <span class="mb-1 block text-sm font-medium text-toned">Échéance</span>
              <CalendarPicker v-model="taskForm.due_date" hide-actions />
            </div>

            <div v-else>
              <span class="mb-1 block text-sm font-medium text-toned">Créneau</span>
              <div class="mb-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-cy="bound-start"
                  class="rounded-lg border px-3 py-2 text-left text-xs transition"
                  :class="
                    editedBound === 'start'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-default text-toned hover:bg-elevated'
                  "
                  @click="editedBound = 'start'"
                >
                  <span class="block font-semibold uppercase tracking-wide">Début</span>
                  <span class="mt-0.5 block">{{ formatDueDateShort(eventForm.start_date) }}</span>
                </button>
                <button
                  type="button"
                  data-cy="bound-end"
                  class="rounded-lg border px-3 py-2 text-left text-xs transition"
                  :class="
                    editedBound === 'end'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-default text-toned hover:bg-elevated'
                  "
                  @click="editedBound = 'end'"
                >
                  <span class="block font-semibold uppercase tracking-wide">Fin</span>
                  <span class="mt-0.5 block">{{ formatDueDateShort(eventForm.end_date) }}</span>
                </button>
              </div>
              <CalendarPicker v-model="eventDraft" hide-actions />
              <p v-if="invalidRange" class="mt-2 text-xs text-error">
                La fin doit être postérieure au début.
              </p>
              <p v-else-if="eventForm.errors.end_date" class="mt-2 text-xs text-error">
                {{ eventForm.errors.end_date }}
              </p>
            </div>

            <div v-if="mode === 'event'">
              <label for="item-location" class="mb-1 block text-sm font-medium text-toned">
                Lieu
              </label>
              <input
                id="item-location"
                v-model="eventForm.location"
                type="text"
                placeholder="Optionnel..."
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label for="item-description" class="mb-1 block text-sm font-medium text-toned">
                Description
              </label>
              <textarea
                v-if="mode === 'task'"
                id="item-description"
                v-model="taskForm.description"
                rows="2"
                placeholder="Optionnel..."
                class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <textarea
                v-else
                id="item-description"
                v-model="eventForm.description"
                rows="2"
                placeholder="Optionnel..."
                class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <footer class="flex justify-end gap-2 border-t border-default px-5 py-3">
            <UButton type="button" color="neutral" variant="ghost" @click="open = false">
              Annuler
            </UButton>
            <UButton
              type="submit"
              color="primary"
              data-cy="submit-item"
              :loading="processing"
              :disabled="!canSubmit"
            >
              Créer
            </UButton>
          </footer>
        </form>

        <div v-else class="px-5 py-6">
          <p class="text-sm text-muted">
            Créez d'abord une liste personnelle depuis vos to do lists pour pouvoir y ajouter une
            tâche.
          </p>
          <div class="mt-4 flex justify-end">
            <UButton type="button" color="neutral" variant="ghost" @click="open = false">
              Fermer
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
