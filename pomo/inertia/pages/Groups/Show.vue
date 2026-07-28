<script setup lang="ts">
import { computed, ref } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import CardTitle from '~/components/CardTitle.vue'
import MemberAvatar from '~/components/todo/MemberAvatar.vue'
import SyncCalendarModal from '~/components/calendar/SyncCalendarModal.vue'
import AddToCalendarModal from '~/components/calendar/AddToCalendarModal.vue'
import AgendaList from '~/components/calendar/AgendaList.vue'
import EventModal from '~/components/calendar/EventModal.vue'
import TaskModal from '~/components/todo/TaskModal.vue'
import GroupChat from '~/components/groups/GroupChat.vue'
import { buildAgenda, canManageItem, toCalendarEntries, visibleTimeRange } from '~/utils/calendar'
import type { AgendaItem, CalendarEvent, CalendarTask } from '~/types/calendar'
import type { GroupChatBootstrap, GroupDetail, GroupMember } from '~/types/group'

const props = defineProps<{
  group: GroupDetail
  currentUserId: number
  members: GroupMember[]
  tasks: CalendarTask[]
  events: CalendarEvent[]
  calendarFeedUrl: string
  chat: GroupChatBootstrap
}>()

const isOwner = computed(() => props.group.ownerId === props.currentUserId)

// --- Renommer le groupe (propriétaire) ---
const isEditingName = ref(false)
const renameForm = useForm({ name: props.group.name })
const blurTarget = (event: KeyboardEvent) => (event.target as HTMLInputElement).blur()

const startRename = () => {
  renameForm.name = props.group.name
  renameForm.clearErrors()
  isEditingName.value = true
}

const cancelRename = () => {
  renameForm.name = props.group.name
  isEditingName.value = false
}

const saveGroupName = () => {
  const name = renameForm.name.trim()
  if (name === '' || name === props.group.name) {
    cancelRename()
    return
  }
  renameForm.put(`/groups/${props.group.id}`, {
    preserveScroll: true,
    onSuccess: () => (isEditingName.value = false),
  })
}

const isSyncModalOpen = ref(false)

const entries = computed(() => toCalendarEntries(props.tasks, props.events))
const agenda = computed(() => buildAgenda(props.tasks, props.events))
const timeRange = computed(() => visibleTimeRange(props.tasks, props.events))

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

const canManageSelectedEvent = computed(() =>
  selectedEvent.value
    ? canManageItem(selectedEvent.value.createdBy, props.currentUserId, isOwner.value)
    : false
)

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
  if (entryJustClicked) return
  openAddModal(date)
}

// --- Modal d'invitation ---
const isInviteModalOpen = ref(false)
const inviteForm = useForm({ email: '' })

const submitInvite = () => {
  inviteForm.post(`/groups/${props.group.id}/invite`, {
    preserveScroll: true,
    onSuccess: () => {
      if (!inviteForm.errors.email) {
        isInviteModalOpen.value = false
        inviteForm.reset()
      }
    },
  })
}

const removeMember = (userId: number) => {
  if (!confirm('Retirer ce membre du groupe ?')) return
  router.delete(`/groups/${props.group.id}/members/${userId}`, { preserveScroll: true })
}

const leaveGroup = () => {
  if (!confirm('Quitter ce groupe ?')) return
  router.post(`/groups/${props.group.id}/leave`)
}

const deleteGroup = () => {
  if (!confirm('Supprimer définitivement ce groupe et son calendrier ?')) return
  router.delete(`/groups/${props.group.id}`)
}
</script>

<template>
  <DashboardLayout>
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a
            href="/groups"
            class="mb-1 inline-flex items-center gap-1 text-xs text-muted hover:text-primary"
          >
            <UIcon name="i-heroicons-arrow-left" class="h-3.5 w-3.5" />
            Mes groupes
          </a>
          <div class="flex items-center gap-2">
            <input
              v-if="isOwner && isEditingName"
              v-model="renameForm.name"
              class="max-w-xs rounded-md border border-primary bg-default px-1.5 py-0.5 text-xl font-bold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-2xl"
              aria-label="Nom du groupe"
              autofocus
              @blur="saveGroupName"
              @keyup.enter="blurTarget"
              @keyup.esc="cancelRename"
            />
            <template v-else>
              <h1 data-cy="group-name" class="text-xl font-bold text-primary sm:text-2xl">
                {{ group.name }}
              </h1>
              <button
                v-if="isOwner"
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md text-dimmed transition hover:bg-elevated hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Renommer le groupe"
                @click="startRename"
              >
                <UIcon name="i-heroicons-pencil-square" class="h-4 w-4" />
              </button>
            </template>
          </div>
          <p v-if="renameForm.errors.name" class="mt-1 text-xs text-error">
            {{ renameForm.errors.name }}
          </p>
          <p v-if="group.description" class="mt-1 text-sm text-muted">{{ group.description }}</p>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            v-if="isOwner"
            data-cy="invite-button"
            icon="i-heroicons-user-plus"
            color="primary"
            variant="soft"
            @click="isInviteModalOpen = true"
          >
            Inviter
          </UButton>
          <UButton
            v-if="isOwner"
            icon="i-heroicons-trash"
            color="error"
            variant="ghost"
            @click="deleteGroup"
          >
            Supprimer
          </UButton>
          <UButton
            v-else
            icon="i-heroicons-arrow-right-on-rectangle"
            color="error"
            variant="ghost"
            @click="leaveGroup"
          >
            Quitter
          </UButton>
        </div>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row">
        <div class="order-last w-full lg:order-first lg:w-1/4">
          <GroupChat
            :group-id="group.id"
            :current-user-id="currentUserId"
            :is-owner="isOwner"
            :chat="chat"
          />
        </div>

        <!-- Calendrier partagé -->
        <UCard
          class="flex w-full flex-col rounded-2xl border border-default shadow-md ring-0 lg:w-1/2"
        >
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <CardTitle title="Calendrier partagé" />
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
          <vue-cal
            style="height: 450px"
            locale="fr"
            default-view="week"
            hide-view-selector
            :events="entries"
            :time-from="timeRange.from"
            :time-to="timeRange.to"
            time-at-cursor
            xsmall
            @cell-click="onCellClick"
            @event-click="onEntryClick"
          />
        </UCard>

        <div class="flex w-full flex-col gap-6 lg:w-1/4">
          <!-- Membres -->
          <UCard class="rounded-2xl border border-default shadow-md ring-0">
            <template #header>
              <CardTitle title="Membres" />
            </template>
            <ul class="divide-y divide-default">
              <li
                v-for="member in members"
                :key="member.id"
                data-cy="member-row"
                class="flex items-center justify-between gap-2 py-2.5"
              >
                <div class="flex items-center gap-2.5">
                  <MemberAvatar :member="member" />
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-highlighted">
                      {{ member.firstName }} {{ member.lastName }}
                    </span>
                    <span class="text-xs text-dimmed">{{ member.email }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="member.role === 'owner'"
                    class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    Propriétaire
                  </span>
                  <button
                    v-else-if="isOwner"
                    type="button"
                    class="flex h-6 w-6 items-center justify-center rounded text-dimmed transition hover:bg-error/10 hover:text-error"
                    aria-label="Retirer ce membre"
                    @click="removeMember(member.id)"
                  >
                    <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
                  </button>
                </div>
              </li>
            </ul>
          </UCard>

          <!-- Tâches et évènements partagés -->
          <UCard class="rounded-2xl border border-default shadow-md ring-0">
            <template #header>
              <CardTitle title="Tâches et évènements" />
            </template>
            <div class="max-h-100 overflow-y-auto">
              <AgendaList
                :items="agenda"
                :show-calendar-badge="false"
                empty-title="Rien de prévu"
                empty-description="Cliquez sur le calendrier pour ajouter une tâche ou un évènement au groupe."
                @select="openItem"
              />
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <AddToCalendarModal
      v-model:open="isAddModalOpen"
      :locked-group-id="group.id"
      :default-date="addDefaultDate"
    />

    <TaskModal
      v-if="selectedTask"
      v-model:open="isTaskModalOpen"
      :task="selectedTask"
      :list-name="group.name"
      is-group-list
    />

    <EventModal
      v-if="selectedEvent"
      v-model:open="isEventModalOpen"
      :event="selectedEvent"
      :can-manage="canManageSelectedEvent"
    />

    <!-- Modal invitation -->
    <UModal
      v-model:open="isInviteModalOpen"
      title="Inviter un membre"
      :ui="{ content: 'sm:max-w-sm' }"
    >
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-4 text-base font-semibold text-highlighted">Inviter un membre</h2>

          <form class="space-y-4" @submit.prevent="submitInvite">
            <div>
              <label for="invite-email" class="mb-1 block text-sm font-medium text-toned">
                Email de l'utilisateur
              </label>
              <input
                id="invite-email"
                v-model="inviteForm.email"
                type="email"
                placeholder="prenom.nom@email.com"
                autofocus
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p v-if="inviteForm.errors.email" class="mt-1 text-xs text-error">
                {{ inviteForm.errors.email }}
              </p>
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                @click="isInviteModalOpen = false"
              >
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="inviteForm.processing"
                :disabled="!inviteForm.email.trim()"
              >
                Inviter
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <SyncCalendarModal v-model:open="isSyncModalOpen" :feed-url="calendarFeedUrl" />
  </DashboardLayout>
</template>
