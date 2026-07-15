<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { buildTimeOptions, snapToHalfHour, formatDueDateLong, toIsoInstant } from '~/utils/date'

const props = defineProps<{
  taskId: number
  dueDate: string | null
}>()

const emit = defineEmits<{ saved: []; cancel: [] }>()

const timeOptions = buildTimeOptions()

const buildInitialDate = (): DateValue => {
  if (!props.dueDate) return today(getLocalTimeZone())
  const date = new Date(props.dueDate)
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const buildInitialTime = () => {
  if (!props.dueDate) return '12:00'
  const date = new Date(props.dueDate)
  return snapToHalfHour(date.getHours(), date.getMinutes())
}

const calendarValue = ref<DateValue>(buildInitialDate())
const time = ref(buildInitialTime())
const processing = ref(false)

watch(
  () => props.dueDate,
  () => {
    calendarValue.value = buildInitialDate()
    time.value = buildInitialTime()
  }
)

const summary = computed(() => {
  const date = calendarValue.value
  const [hours, minutes] = time.value.split(':').map(Number)
  return formatDueDateLong(new Date(date.year, date.month - 1, date.day, hours, minutes))
})

const submit = (dueDate: string | null) => {
  router.put(
    `/tasks/${props.taskId}`,
    { due_date: dueDate },
    {
      preserveScroll: true,
      onStart: () => (processing.value = true),
      onFinish: () => (processing.value = false),
      onSuccess: () => emit('saved'),
    }
  )
}

const save = () => {
  const date = calendarValue.value
  const [hours, minutes] = time.value.split(':').map(Number)
  submit(toIsoInstant(date.year, date.month, date.day, hours, minutes))
}

const clear = () => submit(null)

const calendarUi = {
  cellTrigger: [
    'data-[selected]:bg-green-700 data-[selected]:text-white',
    'data-today:not-data-[selected]:text-green-700',
    'hover:not-data-[selected]:bg-green-100',
    'data-[highlighted]:bg-green-100',
    'focus-visible:ring-green-600',
  ].join(' '),
}
</script>

<template>
  <div data-cy="calendar-picker" class="rounded-xl border border-green-200 bg-green-50/40 p-3">
    <div class="flex justify-center">
      <UCalendar v-model="calendarValue" color="neutral" :ui="calendarUi" class="w-full max-w-76" />
    </div>

    <div class="mt-3">
      <label class="mb-1 block text-sm font-medium text-gray-700">Heure</label>
      <USelect
        v-model="time"
        :items="timeOptions"
        icon="i-heroicons-clock"
        class="w-full"
        data-cy="time-select"
      />
    </div>

    <p class="mt-3 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
      <UIcon name="i-heroicons-calendar-days" class="h-4 w-4 shrink-0" />
      <span class="first-letter:uppercase">{{ summary }}</span>
    </p>

    <div class="mt-3 flex items-center justify-between gap-2">
      <UButton
        v-if="dueDate"
        type="button"
        color="neutral"
        variant="ghost"
        :disabled="processing"
        @click="clear"
      >
        Effacer
      </UButton>
      <div class="ml-auto flex gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          :disabled="processing"
          @click="emit('cancel')"
        >
          Annuler
        </UButton>
        <UButton
          type="button"
          color="neutral"
          variant="solid"
          class="bg-green-700 text-white hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-600"
          :loading="processing"
          data-cy="save-due-date"
          @click="save"
        >
          Enregistrer
        </UButton>
      </div>
    </div>
  </div>
</template>
