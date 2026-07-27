import edge from 'edge.js'
import mjml2html from 'mjml'
import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import type GroupInvitation from '#models/group_invitation'

export default class GroupInvitationMail extends BaseMail {
  constructor(
    readonly invitation: GroupInvitation,
    private token: string,
    private groupName: string,
    private inviterName: string
  ) {
    super()
  }

  async prepare() {
    const acceptUrl = `${env.get('APP_URL')}/invitations/${this.token}`

    const mjmlSource = await edge.render('emails/group_invitation', {
      groupName: this.groupName,
      inviterName: this.inviterName,
      inviteeEmail: this.invitation.email,
      acceptUrl,
    })

    const { html } = await mjml2html(mjmlSource, { validationLevel: 'soft' })

    this.message
      .from(env.get('MAIL_FROM_ADDRESS', 'no-reply@willix.fr'), env.get('MAIL_FROM_NAME', 'Pomo'))
      .to(this.invitation.email)
      .subject(`${this.inviterName} vous invite à rejoindre « ${this.groupName} » sur Pomo`)
      .html(html)
  }
}
