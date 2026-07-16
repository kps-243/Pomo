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
    dueDate: string
    duration: number
  }[]
}>()

const tasksParsed = computed(() => {
  return props.tasks
    .filter((t) => t.dueDate && t.duration)
    .map((task) => {
      const start = new Date(task.dueDate)
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
  due_date: '',
  duration: 60,
  description: '',
})

const pad = (n: number) => String(n).padStart(2, '0')

const toDatetimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

const onCellClick = (date: Date) => {
  form.reset()
  form.title = ''
  form.due_date = toDatetimeLocal(date)
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
        class="flex w-full flex-col rounded-2xl border border-default shadow-md ring-0 lg:w-1/2"
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
        </div>
      </UCard>
    </div>

    <!-- Modal création d'événement -->
    <UModal v-model:open="isModalOpen" title="Nouvel événement" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-4 text-base font-semibold text-highlighted">Nouvel événement</h2>

          <form class="space-y-4" @submit.prevent="submit">
            <div>
              <label for="event-title" class="mb-1 block text-sm font-medium text-toned"
                >Titre *</label
              >
              <input
                id="event-title"
                v-model="form.title"
                type="text"
                placeholder="Nom de l'événement"
                autofocus
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p v-if="form.errors.title" class="mt-1 text-xs text-error">
                {{ form.errors.title }}
              </p>
            </div>

            <div>
              <label for="event-date" class="mb-1 block text-sm font-medium text-toned"
                >Date et heure</label
              >
              <input
                id="event-date"
                v-model="form.due_date"
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
                v-model.number="form.duration"
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
                v-model="form.description"
                rows="2"
                placeholder="Optionnel..."
                class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <UButton type="button" color="neutral" variant="ghost" @click="isModalOpen = false">
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="primary"
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
