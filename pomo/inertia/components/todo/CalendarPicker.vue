<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { buildTimeOptions, snapToHalfHour, formatDueDateLong, toIsoInstant } from '~/utils/date'

const props = withDefaults(
  defineProps<{
    clearable?: boolean
    processing?: boolean
    hideActions?: boolean
    saveLabel?: string
  }>(),
  { clearable: false, processing: false, hideActions: false, saveLabel: 'Enregistrer' }
)

const emit = defineEmits<{ save: [iso: string]; cancel: []; clear: [] }>()

const modelValue = defineModel<string | null>({ default: null })

const timeOptions = buildTimeOptions()

const buildInitialDate = (): DateValue => {
  if (!modelValue.value) return today(getLocalTimeZone())
  const date = new Date(modelValue.value)
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const buildInitialTime = () => {
  if (!modelValue.value) return '12:00'
  const date = new Date(modelValue.value)
  return snapToHalfHour(date.getHours(), date.getMinutes())
}

const calendarValue = ref<DateValue>(buildInitialDate())
const time = ref(buildInitialTime())

const calendarModel = computed<DateValue>({
  get: () => calendarValue.value,
  set: (value: DateValue | null | undefined) => {
    if (value) calendarValue.value = value
  },
})

const selectedIso = computed(() => {
  const date = calendarValue.value
  const [hours, minutes] = time.value.split(':').map(Number)
  return toIsoInstant(date.year, date.month, date.day, hours, minutes)
})

watch([calendarValue, time], () => {
  if (selectedIso.value !== modelValue.value) modelValue.value = selectedIso.value
})

watch(modelValue, (value) => {
  if (value === selectedIso.value) return
  calendarValue.value = buildInitialDate()
  time.value = buildInitialTime()
})

const summary = computed(() => formatDueDateLong(new Date(selectedIso.value)))

const calendarUi = {
  cellTrigger: [
    'data-[selected]:bg-primary data-[selected]:text-inverted',
    'data-today:not-data-[selected]:text-primary',
    'hover:not-data-[selected]:bg-primary/10',
    'data-[highlighted]:bg-primary/10',
    'focus-visible:ring-primary',
  ].join(' '),
}
</script>

<template>
  <div data-cy="calendar-picker" class="rounded-xl border border-default bg-muted p-3">
    <div class="flex justify-center">
      <UCalendar v-model="calendarModel" color="neutral" :ui="calendarUi" class="w-full max-w-76" />
    </div>

    <div class="mt-3">
      <label for="due-time" class="mb-1 block text-sm font-medium text-toned">Heure</label>
      <USelect
        id="due-time"
        v-model="time"
        :items="timeOptions"
        icon="i-heroicons-clock"
        class="w-full"
        data-cy="time-select"
      />
    </div>

    <p
      class="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary-800 dark:text-primary-300"
    >
      <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 shrink-0" />
      <span class="first-letter:uppercase">{{ summary }}</span>
    </p>

    <div v-if="!props.hideActions" class="mt-3 flex items-center justify-between gap-2">
      <UButton
        v-if="props.clearable"
        type="button"
        color="neutral"
        variant="ghost"
        :disabled="props.processing"
        @click="emit('clear')"
      >
        Effacer
      </UButton>
      <div class="ml-auto flex gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="props.processing"
          @click="emit('cancel')"
        >
          Annuler
        </UButton>
        <UButton
          type="button"
          color="primary"
          variant="solid"
          :loading="props.processing"
          data-cy="save-due-date"
          @click="emit('save', selectedIso)"
        >
          {{ props.saveLabel }}
        </UButton>
      </div>
    </div>
  </div>
</template>
