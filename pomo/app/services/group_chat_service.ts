import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import GroupMessage from '#models/group_message'
import GroupMessageReport from '#models/group_message_report'
import type {
  GroupMessageReportReason,
  GroupMessageReportStatus,
} from '#models/group_message_report'
import User from '#models/user'
import { sendMessageValidator, reportMessageValidator } from '#validators/group_message'

export const DEFAULT_HISTORY_LIMIT = 30

export type ChatErrorCode = 'forbidden' | 'not_found' | 'invalid'

/**
 * Erreur métier du tchat. Le gateway WebSocket la convertit en payload d'ack
 * et le controller HTTP en statut de réponse, sans dupliquer les règles.
 */
export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export interface MessageAuthorDto {
  id: number
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export interface MessageDto {
  id: number
  content: string
  createdAt: string
  author: MessageAuthorDto
}

export interface MessageReportDto {
  id: number
  reason: GroupMessageReportReason
  comment: string | null
  status: GroupMessageReportStatus
  createdAt: string
  reporter: MessageAuthorDto
  message: {
    id: number
    content: string
    deleted: boolean
    author: MessageAuthorDto
  }
}

function toAuthorDto(user: User): MessageAuthorDto {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar ?? null,
  }
}
/**
 * Sérialise un message pour le client. Le message doit avoir sa relation
 * `user` préchargée.
 */
export function serializeMessage(message: GroupMessage): MessageDto {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISO() ?? '',
    author: toAuthorDto(message.user),
  }
}

/**
 * Renvoie le rôle de l'utilisateur dans le groupe, ou null s'il n'en est pas
 * membre. Volontairement une requête sur le pivot plutôt qu'un preload : cet
 * appel est fait à chaque message envoyé et à chaque connexion WebSocket.
 */
export async function getMembershipRole(
  groupId: number,
  userId: number
): Promise<'owner' | 'member' | null> {
  const row = await db
    .from('group_members')
    .where('group_id', groupId)
    .where('user_id', userId)
    .select('role')
    .first()

  return row?.role ?? null
}

/**
 * Vérifie l'appartenance et lève une ChatError sinon. À rappeler à chaque
 * action : un jeton de tchat reste valide après une exclusion du groupe, donc
 * l'autorisation ne peut pas reposer sur le jeton seul.
 */
export async function assertMembership(
  groupId: number,
  userId: number
): Promise<'owner' | 'member'> {
  const role = await getMembershipRole(groupId, userId)
  if (!role) {
    throw new ChatError('forbidden', "Vous n'êtes pas membre de ce groupe")
  }
  return role
}

/**
 * Historique d'un groupe, du plus ancien au plus récent. `before` est l'id du
 * plus vieux message déjà affiché côté client (pagination par curseur, stable
 * même si de nouveaux messages arrivent pendant le défilement).
 * Les messages supprimés sont exclus pour tout le monde.
 */
export async function listMessages(
  groupId: number,
  { before, limit = DEFAULT_HISTORY_LIMIT }: { before?: number; limit?: number } = {}
): Promise<MessageDto[]> {
  const query = GroupMessage.query()
    .where('group_id', groupId)
    .whereNull('deleted_at')
    .preload('user')
    .orderBy('id', 'desc')
    .limit(limit)

  if (before) {
    query.where('id', '<', before)
  }

  const messages = await query
  return messages.reverse().map(serializeMessage)
}

/**
 * Enregistre un message et renvoie sa version sérialisée, prête à être
 * diffusée dans la room du groupe.
 */
export async function postMessage({
  groupId,
  user,
  content,
}: {
  groupId: number
  user: User
  content: unknown
}): Promise<MessageDto> {
  await assertMembership(groupId, user.id)

  let payload: { content: string }
  try {
    payload = await sendMessageValidator.validate({ content })
  } catch {
    throw new ChatError('invalid', 'Message vide ou trop long')
  }

  const message = await GroupMessage.create({
    groupId,
    userId: user.id,
    content: payload.content,
  })

  message.$setRelated('user', user)
  return serializeMessage(message)
}

/**
 * Suppression logique d'un message : l'auteur peut supprimer le sien, le
 * propriétaire du groupe peut supprimer n'importe lequel. Le contenu reste en
 * base pour la modération, mais n'est plus servi à personne.
 */
export async function deleteMessage({
  messageId,
  userId,
}: {
  messageId: number
  userId: number
}): Promise<{ groupId: number; messageId: number }> {
  const message = await GroupMessage.find(messageId)
  if (!message || message.deletedAt) {
    throw new ChatError('not_found', 'Message introuvable')
  }

  await assertMembership(message.groupId, userId)

  const group = await Group.findOrFail(message.groupId)
  const canDelete = message.userId === userId || group.ownerId === userId
  if (!canDelete) {
    throw new ChatError('forbidden', 'Vous ne pouvez pas supprimer ce message')
  }

  message.deletedAt = DateTime.now()
  message.deletedByUserId = userId
  await message.save()

  return { groupId: message.groupId, messageId: message.id }
}

/**
 * Signale un message au propriétaire du groupe. Un même utilisateur ne peut
 * signaler un message qu'une fois : un second appel met à jour le motif plutôt
 * que de créer un doublon (la contrainte d'unicité en base le garantit aussi).
 */
export async function reportMessage({
  messageId,
  userId,
  reason,
  comment,
}: {
  messageId: number
  userId: number
  reason: unknown
  comment?: unknown
}): Promise<{ groupId: number; reportId: number }> {
  const message = await GroupMessage.find(messageId)
  if (!message || message.deletedAt) {
    throw new ChatError('not_found', 'Message introuvable')
  }

  await assertMembership(message.groupId, userId)

  if (message.userId === userId) {
    throw new ChatError('invalid', 'Vous ne pouvez pas signaler votre propre message')
  }

  let payload: { reason: GroupMessageReportReason; comment?: string | null }
  try {
    payload = await reportMessageValidator.validate({ reason, comment })
  } catch {
    throw new ChatError('invalid', 'Motif de signalement invalide')
  }

  const report = await GroupMessageReport.updateOrCreate(
    { groupMessageId: message.id, reporterId: userId },
    {
      reason: payload.reason,
      comment: payload.comment ?? null,
      status: 'pending',
      reviewedByUserId: null,
      reviewedAt: null,
    }
  )

  return { groupId: message.groupId, reportId: report.id }
}

/**
 * Le propriétaire du groupe en est le modérateur : lui seul consulte et traite
 * les signalements.
 */
async function assertGroupOwner(groupId: number, userId: number): Promise<Group> {
  const group = await Group.find(groupId)
  if (!group) {
    throw new ChatError('not_found', 'Groupe introuvable')
  }
  if (group.ownerId !== userId) {
    throw new ChatError('forbidden', 'Réservé au propriétaire du groupe')
  }
  return group
}

/**
 * Liste les signalements d'un groupe — réservé au propriétaire, qui est le
 * modérateur du tchat. Inclut les messages déjà supprimés : c'est justement la
 * raison pour laquelle on les conserve.
 */
export async function listReports(groupId: number, userId: number): Promise<MessageReportDto[]> {
  await assertGroupOwner(groupId, userId)

  const reports = await GroupMessageReport.query()
    .whereIn('group_message_id', (sub) =>
      sub.from('group_messages').select('id').where('group_id', groupId)
    )
    .preload('reporter')
    .preload('groupMessage', (messageQuery) => messageQuery.preload('user'))
    .orderBy('created_at', 'desc')

  return reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    comment: report.comment,
    status: report.status,
    createdAt: report.createdAt.toISO() ?? '',
    reporter: toAuthorDto(report.reporter),
    message: {
      id: report.groupMessage.id,
      content: report.groupMessage.content,
      deleted: report.groupMessage.isDeleted,
      author: toAuthorDto(report.groupMessage.user),
    },
  }))
}

/**
 * Clôture un signalement. `reviewed` = signalement fondé et traité,
 * `dismissed` = signalement écarté. Dans les deux cas on trace qui a décidé et
 * quand, pour que la modération soit auditable.
 */
export async function resolveReport({
  groupId,
  reportId,
  userId,
  status,
}: {
  groupId: number
  reportId: number
  userId: number
  status: GroupMessageReportStatus
}): Promise<void> {
  await assertGroupOwner(groupId, userId)

  const report = await GroupMessageReport.query()
    .where('id', reportId)
    .whereIn('group_message_id', (sub) =>
      sub.from('group_messages').select('id').where('group_id', groupId)
    )
    .first()

  if (!report) {
    throw new ChatError('not_found', 'Signalement introuvable')
  }

  report.status = status
  report.reviewedByUserId = userId
  report.reviewedAt = DateTime.now()
  await report.save()
}
