import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/auth'
import {
  sendPasswordResetEmail,
  findValidResetToken,
  consumeResetToken,
} from '#services/password_reset_service'

export default class PasswordResetsController {
  showForgotForm({ inertia }: HttpContext) {
    return inertia.render('Auth/ForgotPassword')
  }

  async sendForgotEmail({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    // Same response whether the account exists or not, to avoid leaking which emails are registered.
    const user = await User.findBy('email', email)
    if (user) {
      await sendPasswordResetEmail(user)
    }

    return response.redirect('/login')
  }

  async showResetForm({ params, inertia }: HttpContext) {
    const resetToken = await findValidResetToken(params.token)
    return inertia.render('Auth/ResetPassword', { valid: Boolean(resetToken), token: params.token })
  }

  async resetPassword({ params, request, auth, response }: HttpContext) {
    const resetToken = await findValidResetToken(params.token)
    if (!resetToken) {
      // The GET re-check below will render the "invalid/expired" state.
      return response.redirect(`/password/reset/${params.token}`)
    }

    const { password } = await request.validateUsing(resetPasswordValidator)
    await consumeResetToken(resetToken, password)

    // No-op if there was no active session; clears it otherwise so the new password is required.
    await auth.use('web').logout()

    return response.redirect('/login')
  }
}
