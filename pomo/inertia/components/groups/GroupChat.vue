<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import CardTitle from '~/components/CardTitle.vue'
import MemberAvatar from '~/components/todo/MemberAvatar.vue'
import GroupChatReportsModal from '~/components/groups/GroupChatReportsModal.vue'
import { useGroupChat } from '~/composables/use_group_chat'
import {
  MESSAGE_MAX_LENGTH,
  REPORT_REASON_LABELS,
  canDeleteMessage,
  canReportMessage,
  formatMessageTime,
} from '~/utils/chat'
import type { GroupChatBootstrap, GroupMessage, ReportReason } from '~/types/group'

const props = defineProps<{
  groupId: number
  currentUserId: number
  isOwner: boolean
  chat: GroupChatBootstrap
}>()

const {
  messages,
  connected,
  connectionError,
  hasMore,
  loadingMore,
  sendMessage,
  deleteMessage,
  reportMessage,
  loadMore,
} = useGroupChat(props.groupId, props.chat)

const draft = ref('')
const sending = ref(false)
const actionError = ref<string | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const canSend = computed(() => draft.value.trim().length > 0 && !sending.value)

// évite le scroll auto
function isNearBottom(): boolean {
  const element = scrollContainer.value
  if (!element) return true
  return element.scrollHeight - element.scrollTop - element.clientHeight < 80
}

function scrollToBottom() {
  nextTick(() => {
    const element = scrollContainer.value
    if (element) element.scrollTop = element.scrollHeight
  })
}

watch(
  () => messages.value.length,
  (length, previousLength) => {
    if (length > previousLength && isNearBottom()) scrollToBottom()
  }
)

watch(
  () => props.chat.messages,
  (value) => {
    messages.value = [...value]
    scrollToBottom()
  }
)

async function onSubmit() {
  if (!canSend.value) return

  sending.value = true
  actionError.value = null
  const content = draft.value
  draft.value = ''

  const result = await sendMessage(content)
  if (!result.ok) {
    // Le brouillon est restitué pour ne pas perdre la saisie.
    draft.value = content
    actionError.value = result.error ?? "Impossible d'envoyer le message"
  } else {
    scrollToBottom()
  }
  sending.value = false
}

async function onDelete(message: GroupMessage) {
  if (!confirm('Supprimer ce message ? Il ne sera plus visible par les membres du groupe.')) return

  const result = await deleteMessage(message.id)
  if (!result.ok) actionError.value = result.error ?? 'Suppression impossible'
}

// --- Signalement ---
const reportTarget = ref<GroupMessage | null>(null)
const reportReason = ref<ReportReason>('inappropriate')
const reportComment = ref('')
const reportSubmitting = ref(false)
const isReportModalOpen = computed({
  get: () => reportTarget.value !== null,
  set: (value: boolean) => {
    if (!value) reportTarget.value = null
  },
})

const reasonOptions = Object.entries(REPORT_REASON_LABELS).map(([value, label]) => ({
  value: value as ReportReason,
  label,
}))

function openReport(message: GroupMessage) {
  reportTarget.value = message
  reportReason.value = 'inappropriate'
  reportComment.value = ''
}

async function submitReport() {
  if (!reportTarget.value) return

  reportSubmitting.value = true
  const result = await reportMessage(
    reportTarget.value.id,
    reportReason.value,
    reportComment.value.trim() || undefined
  )
  reportSubmitting.value = false

  if (result.ok) {
    reportTarget.value = null
    actionError.value = null
  } else {
    actionError.value = result.error ?? 'Signalement impossible'
  }
}

const isReportsModalOpen = ref(false)
</script>

<template>
  <UCard
    class="flex w-full flex-col rounded-2xl border border-default shadow-md ring-0"
    :ui="{ body: 'flex-1 flex flex-col min-h-0' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <CardTitle title="Discussion" />
        <div class="flex items-center gap-1.5">
          <UButton
            v-if="isOwner"
            icon="i-heroicons-flag"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Signalements"
            @click="isReportsModalOpen = true"
          />
          <span
            :title="connected ? 'Connecté' : 'Déconnecté'"
            data-cy="chat-status"
            class="h-2 w-2 shrink-0 rounded-full"
            :class="connected ? 'bg-success' : 'bg-warning'"
          />
        </div>
      </div>
    </template>

    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <p v-if="connectionError" class="text-xs text-warning">{{ connectionError }}</p>

      <div
        ref="scrollContainer"
        data-cy="chat-messages"
        class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        style="max-height: 450px"
      >
        <div v-if="hasMore" class="flex justify-center">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="loadingMore"
            @click="loadMore"
          >
            Messages précédents
          </UButton>
        </div>

        <p v-if="!messages.length" class="py-4 text-center text-sm text-muted">
          Aucun message. Lancez la discussion !
        </p>

        <div
          v-for="message in messages"
          :key="message.id"
          data-cy="chat-message"
          class="group flex items-start gap-2"
        >
          <MemberAvatar :member="message.author" />

          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-1.5">
              <span class="truncate text-xs font-medium text-highlighted">
                {{ message.author.firstName }} {{ message.author.lastName }}
              </span>
              <span class="shrink-0 text-[11px] text-dimmed">
                {{ formatMessageTime(message.createdAt) }}
              </span>
            </div>
            <p class="whitespace-pre-wrap break-words text-sm text-default">{{ message.content }}</p>
          </div>

          <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button
              v-if="canReportMessage(message, currentUserId)"
              type="button"
              data-cy="report-message"
              class="flex h-6 w-6 items-center justify-center rounded text-dimmed transition hover:bg-warning/10 hover:text-warning"
              aria-label="Signaler ce message"
              @click="openReport(message)"
            >
              <UIcon name="i-heroicons-flag" class="h-3.5 w-3.5" />
            </button>
            <button
              v-if="canDeleteMessage(message, currentUserId, isOwner)"
              type="button"
              data-cy="delete-message"
              class="flex h-6 w-6 items-center justify-center rounded text-dimmed transition hover:bg-error/10 hover:text-error"
              aria-label="Supprimer ce message"
              @click="onDelete(message)"
            >
              <UIcon name="i-heroicons-trash" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <p v-if="actionError" class="text-xs text-error">{{ actionError }}</p>

      <form class="flex items-end gap-2 border-t border-default pt-3" @submit.prevent="onSubmit">
        <textarea
          v-model="draft"
          data-cy="chat-input"
          rows="2"
          :maxlength="MESSAGE_MAX_LENGTH"
          placeholder="Votre message…"
          aria-label="Votre message"
          class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @keydown.enter.exact.prevent="onSubmit"
        />
        <UButton
          type="submit"
          data-cy="chat-send"
          icon="i-heroicons-paper-airplane"
          color="primary"
          :loading="sending"
          :disabled="!canSend"
          aria-label="Envoyer"
        />
      </form>
    </div>
  </UCard>

  <!-- Modal de signalement -->
  <UModal v-model:open="isReportModalOpen" title="Signaler un message" :ui="{ content: 'sm:max-w-md' }">
    <template #content>
      <div class="px-5 py-4">
        <h2 class="mb-4 text-base font-semibold text-highlighted">Signaler un message</h2>

        <p
          v-if="reportTarget"
          class="mb-4 rounded-lg border border-default bg-elevated px-3 py-2 text-sm text-muted"
        >
          {{ reportTarget.content }}
        </p>

        <form class="space-y-4" @submit.prevent="submitReport">
          <div>
            <label for="report-reason" class="mb-1 block text-sm font-medium text-toned">Motif</label>
            <select
              id="report-reason"
              v-model="reportReason"
              class="w-full rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option v-for="option in reasonOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="report-comment" class="mb-1 block text-sm font-medium text-toned">
              Précisions (optionnel)
            </label>
            <textarea
              id="report-comment"
              v-model="reportComment"
              rows="2"
              maxlength="500"
              class="w-full resize-none rounded-lg border border-accented bg-default px-3 py-2 text-sm text-default transition placeholder:text-dimmed focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <p class="text-xs text-dimmed">
            Le signalement est transmis au propriétaire du groupe, seul habilité à le traiter.
          </p>

          <div class="flex justify-end gap-2 pt-1">
            <UButton type="button" color="neutral" variant="ghost" @click="reportTarget = null">
              Annuler
            </UButton>
            <UButton type="submit" color="warning" :loading="reportSubmitting">Signaler</UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>

  <GroupChatReportsModal v-model:open="isReportsModalOpen" :group-id="groupId" />
</template>
