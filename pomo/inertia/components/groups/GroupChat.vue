<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const scrollContent = ref<HTMLElement | null>(null)
const FOLLOW_THRESHOLD_PX = 80
const follow = ref(true)

// --- Redimensionnement de la zone de discussion ---
const MIN_HEIGHT = 240
const MAX_HEIGHT = 720
const chatHeight = ref(380)
const isPopup = ref(false)

let dragStartY = 0
let dragStartHeight = 0

function onResize(event: MouseEvent) {
  const delta = event.clientY - dragStartY
  chatHeight.value = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartHeight + delta))
  if (follow.value) pinToBottom()
}

function stopResize() {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

function startResize(event: MouseEvent) {
  dragStartY = event.clientY
  dragStartHeight = chatHeight.value
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

function toggleExpand() {
  isPopup.value = !isPopup.value
  nextTick(() => {
    if (follow.value) pinToBottom()
  })
}

function onPopupKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') isPopup.value = false
}

watch(isPopup, (value) => {
  if (typeof window === 'undefined') return
  if (value) window.addEventListener('keydown', onPopupKeydown)
  else window.removeEventListener('keydown', onPopupKeydown)
})

const canSend = computed(() => draft.value.trim().length > 0 && !sending.value)
const isOwn = (message: GroupMessage) => message.author.id === props.currentUserId

function pinToBottom() {
  const element = scrollContainer.value
  if (element) element.scrollTop = element.scrollHeight
}

function onScroll() {
  const element = scrollContainer.value
  if (!element) return
  follow.value =
    element.scrollHeight - element.scrollTop - element.clientHeight < FOLLOW_THRESHOLD_PX
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  pinToBottom()

  if (scrollContent.value) {
    resizeObserver = new ResizeObserver(() => {
      if (follow.value) pinToBottom()
    })
    resizeObserver.observe(scrollContent.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  stopResize()
  window.removeEventListener('keydown', onPopupKeydown)
})

watch(
  () => messages.value.length,
  (length, previousLength) => {
    if (length > previousLength && follow.value) nextTick(pinToBottom)
  }
)

watch(
  () => props.chat.messages,
  (value) => {
    messages.value = [...value]
    follow.value = true
    nextTick(pinToBottom)
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
    // Envoyer un message ramène toujours en bas, même si on lisait plus haut.
    follow.value = true
    nextTick(pinToBottom)
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
  <Teleport to="body">
    <div
      v-if="isPopup"
      class="fixed inset-0 z-40 bg-black/50"
      aria-hidden="true"
      @click="isPopup = false"
    />
  </Teleport>

  <Teleport to="body" :disabled="!isPopup">
    <UCard
      :class="
        isPopup
          ? 'fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-default shadow-2xl ring-0'
          : 'w-full rounded-2xl border border-default shadow-md ring-0'
      "
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
            <UButton
              :icon="isPopup ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="isPopup ? 'Réduire la discussion' : 'Agrandir la discussion'"
              @click="toggleExpand"
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

      <div class="flex flex-col gap-2">
        <p v-if="connectionError" class="text-xs text-warning">{{ connectionError }}</p>
        <div
          ref="scrollContainer"
          data-cy="chat-messages"
          class="overflow-y-auto pr-1"
          :style="{ height: isPopup ? '55vh' : chatHeight + 'px' }"
          @scroll.passive="onScroll"
        >
          <div ref="scrollContent" class="flex flex-col gap-3">
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
              class="group flex items-end gap-2"
              :class="isOwn(message) ? 'flex-row-reverse' : 'flex-row'"
            >
              <MemberAvatar :member="message.author" />

              <div
                class="flex min-w-0 max-w-[75%] flex-col"
                :class="isOwn(message) ? 'items-end' : 'items-start'"
              >
                <div
                  class="flex items-baseline gap-1.5"
                  :class="isOwn(message) ? 'flex-row-reverse' : 'flex-row'"
                >
                  <span class="truncate text-xs font-medium text-highlighted">
                    {{ message.author.firstName }} {{ message.author.lastName }}
                  </span>
                  <span class="shrink-0 text-[11px] text-dimmed">
                    {{ formatMessageTime(message.createdAt) }}
                  </span>
                </div>
                <div
                  class="mt-1 rounded-2xl px-3 py-2 text-sm"
                  :class="
                    isOwn(message)
                      ? 'rounded-br-sm bg-primary text-inverted'
                      : 'rounded-bl-sm bg-elevated text-default'
                  "
                >
                  <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
                </div>
              </div>

              <div
                class="flex shrink-0 items-center gap-0.5 self-center opacity-0 transition group-hover:opacity-100"
              >
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
        </div>

        <p v-if="actionError" class="text-xs text-error">{{ actionError }}</p>

        <div
          v-if="!isPopup"
          class="flex cursor-ns-resize items-center justify-center py-1.5"
          role="separator"
          aria-label="Redimensionner la discussion"
          title="Glisser pour redimensionner"
          @mousedown="startResize"
        >
          <span class="h-1 w-10 rounded-full bg-[var(--ui-border)]"></span>
        </div>

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
  </Teleport>

  <!-- Modal de signalement -->
  <UModal
    v-model:open="isReportModalOpen"
    title="Signaler un message"
    :ui="{ content: 'sm:max-w-md' }"
  >
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
            <label for="report-reason" class="mb-1 block text-sm font-medium text-toned"
              >Motif</label
            >
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
