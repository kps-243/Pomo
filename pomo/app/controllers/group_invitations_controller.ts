import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import {
  findInvitationByToken,
  getInvitationStatus,
  acceptInvitation,
} from '#services/group_invitation_service'

const ERROR_MESSAGES = {
  expired: 'Cette invitation a expiré.',
  already_used: 'Cette invitation a déjà été utilisée.',
  email_mismatch: 'Cette invitation a été envoyée à une autre adresse e-mail que la vôtre.',
} as const

export default class GroupInvitationsController {
  async show({ params, auth, inertia, session }: HttpContext) {
    const invitation = await findInvitationByToken(params.token)

    if (!invitation) {
      return inertia.render('Invitations/Show', {
        status: 'not_found' as const,
        token: params.token,
      })
    }

    const status = getInvitationStatus(invitation)
    const currentUser = auth.user

    if (!currentUser) {
      session.put('pending_invitation_token', params.token)
    }

    const hasAccount = Boolean(await User.findBy('email', invitation.email))

    return inertia.render('Invitations/Show', {
      status,
      token: params.token,
      groupId: invitation.groupId,
      groupName: invitation.group.name,
      inviterName: `${invitation.invitedBy.first_name} ${invitation.invitedBy.last_name}`.trim(),
      inviteeEmail: invitation.email,
      hasAccount,
      isAuthenticated: Boolean(currentUser),
      currentUserEmail: currentUser?.email ?? null,
      emailMismatch:
        Boolean(currentUser) && currentUser!.email.toLowerCase() !== invitation.email.toLowerCase(),
    })
  }

  async accept({ params, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitation = await findInvitationByToken(params.token)

    if (!invitation) {
      session.flash('error', 'Invitation introuvable.')
      return response.redirect(`/invitations/${params.token}`)
    }

    const result = await acceptInvitation({ invitation, user })

    if (!result.success) {
      session.flash('error', ERROR_MESSAGES[result.reason])
      return response.redirect(`/invitations/${params.token}`)
    }

    session.flash('success', 'Vous avez rejoint le groupe.')
    return response.redirect(`/groups/${result.groupId}`)
  }
}
