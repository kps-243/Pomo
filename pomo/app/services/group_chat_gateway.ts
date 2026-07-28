import type { DefaultEventsMap, Server as SocketServer, Socket } from 'socket.io'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import { verifyChatTicket } from '#services/chat_ticket'
import {
  ChatError,
  assertMembership,
  deleteMessage,
  postMessage,
  reportMessage,
} from '#services/group_chat_service'
import type { MessageDto } from '#services/group_chat_service'

/**
 * Anti-flood : au-delà de cette cadence, les messages sont refusés. Sans cette
 * limite, une boucle côté client remplit la table en quelques secondes.
 */
const RATE_LIMIT_WINDOW_MS = 10_000
const RATE_LIMIT_MAX_MESSAGES = 10

export type AckResponse<T = undefined> =
  | ({ ok: true } & (T extends undefined ? {} : { data: T }))
  | { ok: false; code: string; error: string }

interface ChatSocketData {
  user: User
  groupId: number
  recentMessagesAt: number[]
}

/**
 * Le 4e générique de `Socket` type `socket.data`, sinon laissé à `any`.
 */
type ChatSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, ChatSocketData>

export function groupRoom(groupId: number): string {
  return `group:${groupId}`
}

function failure(error: unknown): AckResponse<never> {
  if (error instanceof ChatError) {
    return { ok: false, code: error.code, error: error.message }
  }
  logger.error({ err: error }, 'Erreur inattendue dans le tchat de groupe')
  return { ok: false, code: 'server_error', error: 'Une erreur est survenue' }
}

/**
 * Enveloppe un handler : normalise la réponse d'ack et empêche qu'une
 * exception non gérée ne fasse tomber le process (un throw dans un listener
 * socket.io n'est pas rattrapé par le handler d'erreurs HTTP d'AdonisJS).
 */
function handle<TPayload, TResult>(handler: (payload: TPayload) => Promise<TResult>) {
  return async (payload: TPayload, ack?: (response: AckResponse<TResult>) => void) => {
    try {
      const data = await handler(payload)
      ack?.({ ok: true, data } as AckResponse<TResult>)
    } catch (error) {
      ack?.(failure(error) as AckResponse<TResult>)
    }
  }
}

function isRateLimited(socket: ChatSocket): boolean {
  const now = Date.now()
  socket.data.recentMessagesAt = socket.data.recentMessagesAt.filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS
  )

  if (socket.data.recentMessagesAt.length >= RATE_LIMIT_MAX_MESSAGES) {
    return true
  }

  socket.data.recentMessagesAt.push(now)
  return false
}

/**
 * Branche l'authentification et les handlers du tchat sur le serveur socket.io.
 */
export function registerChatGateway(io: SocketServer): void {
  io.use(async (socket, next) => {
    try {
      const ticket = verifyChatTicket(socket.handshake.auth?.token)
      if (!ticket) {
        return next(new Error('unauthorized'))
      }

      const user = await User.find(ticket.userId)
      if (!user) {
        return next(new Error('unauthorized'))
      }

      // On revérifie pour pas qu'un user exclu puisse renvoyer un msg avant la fin des 2h du ticket
      await assertMembership(ticket.groupId, user.id)

      socket.data = { user, groupId: ticket.groupId, recentMessagesAt: [] } satisfies ChatSocketData
      next()
    } catch (error) {
      next(error instanceof ChatError ? new Error(error.code) : new Error('unauthorized'))
    }
  })

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as ChatSocket
    const room = groupRoom(socket.data.groupId)
    socket.join(room)

    socket.on(
      'chat:send',
      handle(async (payload: { content?: unknown }): Promise<MessageDto> => {
        if (isRateLimited(socket)) {
          throw new ChatError('invalid', 'Trop de messages envoyés, patientez quelques secondes')
        }

        const message = await postMessage({
          groupId: socket.data.groupId,
          user: socket.data.user,
          content: payload?.content,
        })

        io.to(room).emit('chat:new', message)
        return message
      })
    )

    socket.on(
      'chat:delete',
      handle(async (payload: { messageId?: unknown }) => {
        const messageId = Number(payload?.messageId)
        if (!Number.isInteger(messageId)) {
          throw new ChatError('invalid', 'Identifiant de message invalide')
        }

        const result = await deleteMessage({ messageId, userId: socket.data.user.id })

        io.to(groupRoom(result.groupId)).emit('chat:deleted', { id: result.messageId })
        return { id: result.messageId }
      })
    )

    socket.on(
      'chat:report',
      handle(async (payload: { messageId?: unknown; reason?: unknown; comment?: unknown }) => {
        const messageId = Number(payload?.messageId)
        if (!Number.isInteger(messageId)) {
          throw new ChatError('invalid', 'Identifiant de message invalide')
        }

        const result = await reportMessage({
          messageId,
          userId: socket.data.user.id,
          reason: payload?.reason,
          comment: payload?.comment,
        })

        return { id: result.reportId }
      })
    )
  })
}
