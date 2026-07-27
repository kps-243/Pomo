import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { GroupChatBootstrap, GroupMessage, ReportReason } from '~/types/group'

type AckResponse<T> = { ok: true; data: T } | { ok: false; code: string; error: string }

export interface ChatActionResult {
  ok: boolean
  error?: string
}

const HISTORY_PAGE_SIZE = 30

/**
 * Pilote la connexion WebSocket du tchat d'un groupe.
 *
 * Le socket est créé au montage et fermé au démontage : avec Inertia la
 * navigation est purement client, sans ce nettoyage on accumulerait une
 * connexion par visite de page.
 */
export function useGroupChat(groupId: number, bootstrap: GroupChatBootstrap) {
  const messages = ref<GroupMessage[]>([...bootstrap.messages])
  const connected = ref(false)
  const connectionError = ref<string | null>(null)
  const loadingMore = ref(false)
  const hasMore = ref(bootstrap.messages.length >= HISTORY_PAGE_SIZE)

  const socket = shallowRef<Socket | null>(null)

  function emitWithAck<T>(event: string, payload: unknown): Promise<ChatActionResult> {
    return new Promise((resolve) => {
      if (!socket.value?.connected) {
        resolve({ ok: false, error: 'Connexion au tchat interrompue' })
        return
      }

      socket.value.emit(event, payload, (response: AckResponse<T>) => {
        resolve(response.ok ? { ok: true } : { ok: false, error: response.error })
      })
    })
  }

  async function sendMessage(content: string): Promise<ChatActionResult> {
    const trimmed = content.trim()
    if (!trimmed) {
      return { ok: false, error: 'Message vide' }
    }
    return emitWithAck<GroupMessage>('chat:send', { content: trimmed })
  }

  async function deleteMessage(messageId: number): Promise<ChatActionResult> {
    return emitWithAck<{ id: number }>('chat:delete', { messageId })
  }

  async function reportMessage(
    messageId: number,
    reason: ReportReason,
    comment?: string
  ): Promise<ChatActionResult> {
    return emitWithAck<{ id: number }>('chat:report', { messageId, reason, comment })
  }

  /**
   * Charge la page d'historique précédente. Passe par HTTP et non par le
   * WebSocket : la pagination n'a rien de temps réel.
   */
  async function loadMore(): Promise<void> {
    if (loadingMore.value || !hasMore.value || messages.value.length === 0) {
      return
    }

    loadingMore.value = true
    try {
      const oldestId = messages.value[0].id
      const response = await fetch(
        `/groups/${groupId}/messages?before=${oldestId}&limit=${HISTORY_PAGE_SIZE}`,
        { headers: { Accept: 'application/json' }, credentials: 'same-origin' }
      )
      if (!response.ok) {
        return
      }

      const { messages: older } = (await response.json()) as { messages: GroupMessage[] }
      hasMore.value = older.length >= HISTORY_PAGE_SIZE
      messages.value = [...older, ...messages.value]
    } finally {
      loadingMore.value = false
    }
  }

  onMounted(() => {
    const instance = io(window.location.origin, {
      path: bootstrap.path,
      transports: ['websocket'],
      auth: { token: bootstrap.token },
    })

    instance.on('connect', () => {
      connected.value = true
      connectionError.value = null
    })

    instance.on('disconnect', () => {
      connected.value = false
    })

    instance.on('connect_error', () => {
      connected.value = false
      connectionError.value = 'Tchat indisponible, reconnexion en cours…'
    })

    instance.on('chat:new', (message: GroupMessage) => {
      // Garde-fou contre un doublon si le serveur rediffusait deux fois.
      if (!messages.value.some((existing) => existing.id === message.id)) {
        messages.value = [...messages.value, message]
      }
    })

    instance.on('chat:deleted', ({ id }: { id: number }) => {
      messages.value = messages.value.filter((message) => message.id !== id)
    })

    socket.value = instance
  })

  onBeforeUnmount(() => {
    socket.value?.removeAllListeners()
    socket.value?.disconnect()
    socket.value = null
  })

  return {
    messages,
    connected,
    connectionError,
    hasMore,
    loadingMore,
    sendMessage,
    deleteMessage,
    reportMessage,
    loadMore,
  }
}
