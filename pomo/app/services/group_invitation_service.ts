import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import GroupInvitation from '#models/group_invitation'
import User from '#models/user'
import { generateToken, hashToken } from '#services/secure_token'

const INVITATION_EXPIRY_DAYS = 7

/**
 * Crée une invitation pour (groupe, email), ou fait pivoter le token d'une
 * invitation "pending" déjà active pour ce couple plutôt que d'en créer une
 * seconde (évite les doublons d'invitations actives, cf. point 12).
 */
export async function createOrRefreshInvitation({
  group,
  email,
  invitedBy,
}: {
  group: Group
  email: string
  invitedBy: User
}): Promise<{ invitation: GroupInvitation; token: string }> {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = DateTime.now().plus({ days: INVITATION_EXPIRY_DAYS })

  const existing = await GroupInvitation.query()
    .where('group_id', group.id)
    .where('email', email)
    .where('status', 'pending')
    .first()

  if (existing && existing.expiresAt > DateTime.now()) {
    existing.tokenHash = tokenHash
    existing.expiresAt = expiresAt
    existing.invitedById = invitedBy.id
    await existing.save()
    return { invitation: existing, token }
  }

  if (existing) {
    existing.status = 'expired'
    await existing.save()
  }

  const invitation = await GroupInvitation.create({
    groupId: group.id,
    email,
    invitedById: invitedBy.id,
    tokenHash,
    status: 'pending',
    expiresAt,
  })

  return { invitation, token }
}

export function findInvitationByToken(token: string): Promise<GroupInvitation | null> {
  return GroupInvitation.query()
    .where('token_hash', hashToken(token))
    .preload('group')
    .preload('invitedBy')
    .first()
}

/**
 * Dérive un statut affichable à partir de `status` + `expiresAt` : une
 * invitation "pending" en base peut être expirée depuis sans qu'un job de
 * fond soit venu mettre à jour la colonne.
 */
export function getInvitationStatus(
  invitation: GroupInvitation
): 'valid' | 'expired' | 'accepted' | 'cancelled' {
  if (invitation.status === 'accepted') return 'accepted'
  if (invitation.status === 'cancelled') return 'cancelled'
  if (invitation.status === 'expired') return 'expired'
  if (invitation.expiresAt < DateTime.now()) return 'expired'
  return 'valid'
}

export type AcceptInvitationResult =
  | { success: true; groupId: number }
  | { success: false; reason: 'expired' | 'already_used' | 'email_mismatch' }

export async function acceptInvitation({
  invitation,
  user,
}: {
  invitation: GroupInvitation
  user: User
}): Promise<AcceptInvitationResult> {
  const status = getInvitationStatus(invitation)

  if (status === 'accepted' || status === 'cancelled') {
    return { success: false, reason: 'already_used' }
  }

  if (status === 'expired') {
    if (invitation.status === 'pending') {
      invitation.status = 'expired'
      await invitation.save()
    }
    return { success: false, reason: 'expired' }
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, reason: 'email_mismatch' }
  }

  const alreadyMember = await db
    .from('group_members')
    .where('group_id', invitation.groupId)
    .where('user_id', user.id)
    .first()

  if (!alreadyMember) {
    const group = await Group.findOrFail(invitation.groupId)
    await group.related('members').attach({ [user.id]: { role: 'member' } })
  }

  invitation.status = 'accepted'
  invitation.acceptedAt = DateTime.now()
  await invitation.save()

  return { success: true, groupId: invitation.groupId }
}

/**
 * À appeler juste après un login/register réussi, avec l'utilisateur qui
 * vient d'être authentifié. Si une invitation était en attente (posée en
 * session par GroupInvitationsController.show pour un visiteur non
 * connecté), tente de l'accepter automatiquement et renvoie l'URL de
 * redirection à utiliser à la place du "/" par défaut.
 *
 * On prend `user` en paramètre plutôt que `auth.user` : juste après
 * `auth.use('web').login(user)`, `auth.user` (le getter au niveau de
 * l'Authenticator) est encore `undefined` — il n'est peuplé que par
 * `authenticate()`/`check()`, pas par `login()`.
 */
export async function consumePendingInvitationRedirect({
  user,
  session,
}: {
  user: User
  session: HttpContext['session']
}): Promise<string | null> {
  const token = session.get('pending_invitation_token')
  if (!token) return null
  session.forget('pending_invitation_token')

  const invitation = await findInvitationByToken(token)
  if (!invitation) return null

  const result = await acceptInvitation({ invitation, user })
  return result.success ? `/groups/${result.groupId}` : `/invitations/${token}`
}
