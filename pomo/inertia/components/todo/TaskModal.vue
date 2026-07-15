<script setup lang="ts">
import { ref, watch } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import StatusBadge from './StatusBadge.vue'
import DateBadge from './DateBadge.vue'
import CalendarPicker from './CalendarPicker.vue'
import MemberAvatar from './MemberAvatar.vue'
import type { TaskItem } from '~/types/todo'

const props = defineProps<{
  task: TaskItem
}>()

const open = defineModel<boolean>('open', { default: false })

const form = useForm({
  title: props.task.title,
  description: props.task.description ?? '',
})

const save = () => {
  form.put(`/tasks/${props.task.id}`, { preserveScroll: true })
}

const saveTitle = () => {
  const title = form.title.trim()
  if (title === '' || title === props.task.title) {
    form.title = props.task.title
    return
  }
  save()
}

const saveDescription = () => {
  if ((form.description ?? '') === (props.task.description ?? '')) return
  save()
}

const blurOnEnter = (event: KeyboardEvent) => (event.target as HTMLInputElement).blur()

const confirmingDelete = ref(false)
const isCalendarOpen = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    confirmingDelete.value = false
    isCalendarOpen.value = false
  }
})

const deleteTask = () => {
  router.delete(`/tasks/${props.task.id}`, {
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
  <UModal
    v-model:open="open"
    :title="task.title"
    scrollable
    :ui="{ content: 'sm:max-w-lg border border-green-500' }"
  >
    <template #content>
      <div class="flex max-h-[85vh] flex-col">
        <header
          class="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6"
        >
          <div class="min-w-0 flex-1">
            <input
              v-model="form.title"
              class="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:border-green-400 focus:bg-white focus:outline-none"
              @blur="saveTitle"
              @keyup.enter="blurOnEnter"
            />
            <p v-if="form.errors.title" class="mt-1 px-1 text-xs text-red-500">
              {{ form.errors.title }}
            </p>
            <div class="ml-1 mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge :status="task.status" :task-id="task.id" />
              <DateBadge :due-date="task.dueDate" @click="isCalendarOpen = !isCalendarOpen" />
            </div>
          </div>

          <div class="relative flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label="Supprimer la task"
              @click="confirmingDelete = true"
            >
              <UIcon name="i-heroicons-trash" class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              aria-label="Fermer"
              @click="close"
            >
              <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
            </button>

            <!-- confirmation de suppression -->
            <div
              v-if="confirmingDelete"
              class="absolute right-0 top-10 z-10 w-56 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg"
            >
              <p class="text-sm font-medium text-gray-700">Supprimer cette task ?</p>
              <p class="mt-1 text-xs text-gray-500">Cette action est définitive.</p>
              <div class="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
                  @click="confirmingDelete = false"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  class="rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                  @click="deleteTask"
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
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
              Échéance
            </h3>
            <CalendarPicker
              :task-id="task.id"
              :due-date="task.dueDate"
              @saved="isCalendarOpen = false"
              @cancel="isCalendarOpen = false"
            />
          </section>

          <section>
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              <UIcon name="i-heroicons-user-group" class="h-4 w-4" />
              Membres
            </h3>
            <div v-if="task.assignees.length" class="flex flex-wrap gap-2">
              <div
                v-for="(member, index) in task.assignees"
                :key="index"
                class="flex items-center gap-2 rounded-full bg-gray-50 py-1 pl-1 pr-3"
              >
                <MemberAvatar :member="member" size="md" />
                <span class="text-sm text-gray-700">
                  {{ member.firstName }} {{ member.lastName }}
                </span>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">Aucun membre assigné.</p>
          </section>

          <section>
            <h3
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              <UIcon name="i-heroicons-bars-3-bottom-left" class="h-4 w-4" />
              Description
            </h3>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Ajouter une description plus détaillée..."
              class="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              @blur="saveDescription"
            />
          </section>
        </div>
      </div>
    </template>
  </UModal>
</template>
