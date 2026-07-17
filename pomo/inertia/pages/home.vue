<script setup lang="ts">
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CardTitle from '../components/CardTitle.vue'
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
    startDate: string
    duration: number
  }[]
}>()

const tasksParsed = computed(() => {
  return props.tasks
    .filter((t) => t.startDate && t.duration)
    .map((task) => {
      const start = new Date(task.startDate)
      return {
        start,
        end: new Date(start.getTime() + task.duration * 60000),
        title: task.title,
        content: task.description,
        class: task.status,
      }
    })
})

// --- Create event modal ---
const isModalOpen = ref(false)

const form = useForm({
  title: '',
  start_date: '',
  duration: 60,
  description: '',
})

const pad = (n: number) => String(n).padStart(2, '0')

const toDatetimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

const onCellClick = (date: Date) => {
  form.reset()
  form.title = ''
  form.start_date = toDatetimeLocal(date)
  form.duration = 60
  form.description = ''
  isModalOpen.value = true
}

const submit = () => {
  form.post('/tasks', {
    preserveScroll: true,
    onSuccess: () => {
      isModalOpen.value = false
      form.reset()
    },
  })
}
</script>

<template>
  <DashboardLayout>
    <div class="mt-6 flex w-full flex-col gap-6 lg:flex-row">
      <UCard
        class="flex w-full flex-col rounded-2xl border border-green-500 shadow-md ring-0 lg:w-1/2"
      >
        <template #header>
          <CardTitle title="Calendar" />
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

      <UCard class="w-full rounded-2xl border border-green-500 shadow-md ring-0 lg:w-1/2">
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
              <span class="font-medium text-gray-800">{{ task.title }}</span>
              <span class="text-sm text-gray-500">⏱ {{ task.duration }} min</span>
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

    <!-- Modal création d'événement -->
    <UModal
      v-model:open="isModalOpen"
      title="Nouvel événement"
      :ui="{ content: 'sm:max-w-md border border-green-500' }"
    >
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-4 text-base font-semibold text-gray-800">Nouvel événement</h2>

          <form class="space-y-4" @submit.prevent="submit">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Titre *</label>
              <input
                v-model="form.title"
                type="text"
                placeholder="Nom de l'événement"
                autofocus
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
              <p v-if="form.errors.title" class="mt-1 text-xs text-red-500">
                {{ form.errors.title }}
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Date et heure</label>
              <input
                v-model="form.start_date"
                type="datetime-local"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"> Durée (minutes) </label>
              <input
                v-model.number="form.duration"
                type="number"
                min="5"
                step="5"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"> Description </label>
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="Optionnel..."
                class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="green"
                :loading="form.processing"
                :disabled="!form.title.trim()"
              >
                Créer
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </DashboardLayout>
</template>
