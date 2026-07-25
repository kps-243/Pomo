<script setup lang="ts">
import { computed, ref } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import DashboardLayout from '~/layouts/DashboardLayout.vue'
import CardTitle from '~/components/CardTitle.vue'
import MemberAvatar from '~/components/todo/MemberAvatar.vue'
import { canManageEvent } from '~/utils/groups'
import type { GroupDetail, GroupEvent, GroupMember } from '~/types/group'

const props = defineProps<{
  group: GroupDetail
  currentUserId: number
  members: GroupMember[]
  events: GroupEvent[]
}>()

const isOwner = computed(() => props.group.ownerId === props.currentUserId)

const eventsParsed = computed(() =>
  props.events
    .filter((e) => e.dueDate)
    .map((event) => {
      const start = new Date(event.dueDate as string)
      return {
        start,
        end: new Date(start.getTime() + 60000),
        title: event.title,
        content: event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}` : '',
        class: 'task-marker',
      }
    })
)

const upcomingEvents = computed(() =>
  [...props.events]
    .filter((e) => e.dueDate)
    .sort(
      (a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime()
    )
)

const canManage = (event: GroupEvent) => canManageEvent(event, props.currentUserId, isOwner.value)

// --- Create event modal ---
const isEventModalOpen = ref(false)

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
  isEventModalOpen.value = true
}

const submitEvent = () => {
  eventForm.post(`/groups/${props.group.id}/tasks`, {
    preserveScroll: true,
    onSuccess: () => {
      isEventModalOpen.value = false
      eventForm.reset()
    },
  })
}

const deleteEvent = (eventId: number) => {
  router.delete(`/groups/${props.group.id}/tasks/${eventId}`, { preserveScroll: true })
}

// --- Invite modal ---
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
          <h1 data-cy="group-name" class="text-xl font-bold text-primary sm:text-2xl">
            {{ group.name }}
          </h1>
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
        <!-- Calendrier partagé -->
        <UCard
          class="flex w-full flex-col rounded-2xl border border-default shadow-md ring-0 lg:w-2/3"
        >
          <template #header>
            <CardTitle title="Calendrier partagé" />
          </template>
          <vue-cal
            style="height: 450px"
            default-view="week"
            hide-view-selector
            :events="eventsParsed"
            time-at-cursor
            xsmall
            @cell-click="onCellClick"
          />
        </UCard>

        <div class="flex w-full flex-col gap-6 lg:w-1/3">
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

          <!-- Prochains évènements -->
          <UCard class="rounded-2xl border border-default shadow-md ring-0">
            <template #header>
              <CardTitle title="Prochains évènements" />
            </template>
            <div class="divide-y divide-default">
              <div
                v-for="event in upcomingEvents"
                :key="event.id"
                class="flex items-center justify-between gap-2 py-3"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-highlighted">{{ event.title }}</span>
                  <span class="text-xs text-muted">
                    {{ new Date(event.dueDate as string).toLocaleString() }} · ⏱
                    {{ event.duration }} min
                  </span>
                  <span v-if="event.createdBy" class="text-xs text-dimmed">
                    par {{ event.createdBy.firstName }} {{ event.createdBy.lastName }}
                  </span>
                </div>
                <button
                  v-if="canManage(event)"
                  type="button"
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded text-dimmed transition hover:bg-error/10 hover:text-error"
                  aria-label="Supprimer l'évènement"
                  @click="deleteEvent(event.id)"
                >
                  <UIcon name="i-heroicons-trash" class="h-4 w-4" />
                </button>
              </div>

              <p v-if="!upcomingEvents.length" class="py-3 text-sm text-muted">
                Aucun évènement pour le moment. Cliquez sur le calendrier pour en ajouter un.
              </p>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Modal création d'évènement -->
    <UModal
      v-model:open="isEventModalOpen"
      title="Nouvel évènement"
      :ui="{ content: 'sm:max-w-md' }"
    >
      <template #content>
        <div class="px-5 py-4">
          <h2 class="mb-4 text-base font-semibold text-highlighted">Nouvel évènement</h2>

          <form class="space-y-4" @submit.prevent="submitEvent">
            <div>
              <label for="event-title" class="mb-1 block text-sm font-medium text-toned"
                >Titre *</label
              >
              <input
                id="event-title"
                v-model="eventForm.title"
                type="text"
                placeholder="Nom de l'évènement"
                autofocus
                class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p v-if="eventForm.errors.title" class="mt-1 text-xs text-error">
                {{ eventForm.errors.title }}
              </p>
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
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                @click="isEventModalOpen = false"
              >
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="eventForm.processing"
                :disabled="!eventForm.title.trim()"
              >
                Créer
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

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
  </DashboardLayout>
</template>
