import edge from 'edge.js'
import mjml2html from 'mjml'
import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import type User from '#models/user'

export default class PasswordResetMail extends BaseMail {
  constructor(
    readonly user: User,
    private resetUrl: string
  ) {
    super()
  }

  async prepare() {
    const mjmlSource = await edge.render('emails/password_reset', {
      firstName: this.user.first_name,
      resetUrl: this.resetUrl,
    })

    const { html } = await mjml2html(mjmlSource, { validationLevel: 'soft' })

    this.message
      .from(env.get('MAIL_FROM_ADDRESS', 'no-reply@willix.fr'), env.get('MAIL_FROM_NAME', 'Pomo'))
      .to(this.user.email)
      .subject('Réinitialisation de votre mot de passe Pomo')
      .html(html)
  }
}
