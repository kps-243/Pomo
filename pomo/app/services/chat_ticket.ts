import encryption from '@adonisjs/core/services/encryption'

const TICKET_PURPOSE = 'group-chat'

export const TICKET_TTL = '2 hours'

export interface ChatTicket {
  userId: number
  groupId: number
}

/**
 * Émet le jeton de connexion au tchat, transmis en prop Inertia puis renvoyé
 * par le client dans la handshake WebSocket.
 */
export function issueChatTicket(ticket: ChatTicket): string {
  return encryption.encrypt(ticket, TICKET_TTL, TICKET_PURPOSE)
}

/**
 * Vérifie et décode un jeton. Renvoie null si absent, altéré ou expiré.
 */
export function verifyChatTicket(token: unknown): ChatTicket | null {
  if (typeof token !== 'string' || token.length === 0) {
    return null
  }

  const payload = encryption.decrypt<ChatTicket>(token, TICKET_PURPOSE)
  if (
    !payload ||
    typeof payload.userId !== 'number' ||
    typeof payload.groupId !== 'number' ||
    !Number.isInteger(payload.userId) ||
    !Number.isInteger(payload.groupId)
  ) {
    return null
  }

  return payload
}
