import vine from '@vinejs/vine'
import { REPORT_REASONS } from '#models/group_message_report'

export const MESSAGE_MAX_LENGTH = 2000

/**
 * Valide l'envoi d'un message de tchat. Utilisé aussi bien par le handler
 * WebSocket que par les tests, d'où la compilation d'un validator dédié
 * plutôt qu'une validation inline dans le gateway.
 */
export const sendMessageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(MESSAGE_MAX_LENGTH),
  })
)

/**
 * Valide le signalement d'un message.
 */
export const reportMessageValidator = vine.compile(
  vine.object({
    reason: vine.enum(REPORT_REASONS),
    comment: vine.string().trim().maxLength(500).nullable().optional(),
  })
)

/**
 * Valide la pagination de l'historique (curseur = id du plus ancien message
 * déjà affiché côté client).
 */
export const listMessagesValidator = vine.compile(
  vine.object({
    before: vine.number().positive().optional(),
    limit: vine.number().min(1).max(100).optional(),
  })
)
