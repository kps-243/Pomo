<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { router, useForm, usePage } from '@inertiajs/vue3'
import StatusBadge from './StatusBadge.vue'
import DateBadge from './DateBadge.vue'
import ListBadge from './ListBadge.vue'
import CalendarPicker from './CalendarPicker.vue'
import MemberAvatar from './MemberAvatar.vue'
import type { TaskItem } from '~/types/todo'
import { usePomodoro } from '~/composables/use_pomodoro'

const props = defineProps<{
  task: TaskItem
  listName: string
  isGroupList: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const { setTask, start } = usePomodoro()

const startPomodoro = () => {
  setTask({ id: props.task.id, title: props.task.title })
  start()
  open.value = false
}

const form = useForm({
  title: props.task.title,
  description: props.task.description ?? '',
})

const save = () => {
  form.put(`/tasks/${props.task.id}`, { preserveScroll: true })
}

// Membres de la tâche : l'utilisateur connecté peut se rejoindre / se retirer.
const page = usePage()
const currentUserId = computed(() => (page.props.user as { id: number } | null)?.id ?? null)
const isMember = computed(() =>
  props.task.members.some((member) => member.id === currentUserId.value)
)

const toggleMembership = () => {
  const url = `/tasks/${props.task.id}/members`
  if (isMember.value) {
    router.delete(url, { preserveScroll: true })
  } else {
    router.post(url, {}, { preserveScroll: true })
  }
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

const dueDateDraft = ref<string | null>(props.task.dueDate)
const savingDueDate = ref(false)

watch(
  () => props.task.dueDate,
  (dueDate) => (dueDateDraft.value = dueDate)
)

watch(isCalendarOpen, (isOpen) => {
  if (isOpen) dueDateDraft.value = props.task.dueDate
})

const submitDueDate = (dueDate: string | null) => {
  router.put(
    `/tasks/${props.task.id}`,
    { due_date: dueDate },
    {
      preserveScroll: true,
      onStart: () => (savingDueDate.value = true),
      onFinish: () => (savingDueDate.value = false),
      onSuccess: () => (isCalendarOpen.value = false),
    }
  )
}

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
  <UModal v-model:open="open" :title="task.title" scrollable :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <div class="flex max-h-[85vh] flex-col">
        <header
          class="flex items-start justify-between gap-3 border-b border-default px-4 py-3 sm:px-6"
        >
          <div class="min-w-0 flex-1">
            <input
              v-model="form.title"
              class="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold text-highlighted transition hover:bg-elevated focus:border-primary focus:bg-default focus:outline-none"
              @blur="saveTitle"
              @keyup.enter="blurOnEnter"
            />
            <p v-if="form.errors.title" class="mt-1 px-1 text-xs text-error">
              {{ form.errors.title }}
            </p>
            <div class="ml-1 mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge :status="task.status" :task-id="task.id" />
              <DateBadge :due-date="task.dueDate" @click="isCalendarOpen = !isCalendarOpen" />
              <ListBadge :name="listName" />
              <span
                class="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-toned"
              >
                <UIcon name="i-heroicons-clock" class="h-3.5 w-3.5" />
                {{ task.timeSpent }} min
              </span>
            </div>
            <p v-if="task.createdBy" class="ml-1 mt-1.5 text-xs text-dimmed">
              Créée par {{ task.createdBy.firstName }} {{ task.createdBy.lastName }}
            </p>
            <button
              type="button"
              class="ml-1 mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @click="startPomodoro"
            >
              🍅 Lancer pomodoro
            </button>
          </div>

          <div class="relative flex shrink-0 items-center gap-1">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-md text-dimmed transition hover:bg-error/10 hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
              aria-label="Supprimer la tâche"
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

            <!-- confirmation de suppression -->
            <div
              v-if="confirmingDelete"
              class="absolute right-0 top-10 z-10 w-56 rounded-lg border border-default bg-default p-3 text-left shadow-lg"
            >
              <p class="text-sm font-medium text-toned">Supprimer cette tâche ?</p>
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
              class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
              Échéance
            </h3>
            <CalendarPicker
              v-model="dueDateDraft"
              :clearable="!!task.dueDate"
              :processing="savingDueDate"
              @save="submitDueDate"
              @cancel="isCalendarOpen = false"
              @clear="submitDueDate(null)"
            />
          </section>

          <section v-if="isGroupList">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"
              >
                <UIcon name="i-heroicons-user-group" class="h-4 w-4" />
                Membres
              </h3>
              <button
                type="button"
                class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :class="
                  isMember
                    ? 'text-muted hover:bg-error/10 hover:text-error'
                    : 'text-primary hover:bg-primary/10'
                "
                @click="toggleMembership"
              >
                <UIcon
                  :name="isMember ? 'i-heroicons-user-minus' : 'i-heroicons-user-plus'"
                  class="h-3.5 w-3.5"
                />
                {{ isMember ? 'Quitter' : 'Rejoindre' }}
              </button>
            </div>
            <div v-if="task.members.length" class="flex flex-wrap gap-2">
              <div
                v-for="member in task.members"
                :key="member.id"
                class="flex items-center gap-2 rounded-full bg-elevated py-1 pl-1 pr-3"
              >
                <MemberAvatar :member="member" size="md" />
                <span class="text-sm text-toned">
                  {{ member.firstName }} {{ member.lastName }}
                </span>
              </div>
            </div>
            <p v-else class="text-sm text-muted">Aucun membre pour le moment.</p>
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
