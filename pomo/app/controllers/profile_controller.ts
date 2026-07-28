import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { updateProfileValidator } from '#validators/auth'
import { sendPasswordResetEmail } from '#services/password_reset_service'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'

export default class ProfileController {
  async show({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('Settings/Profile', {
      profile: {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    })
  }

  async update({ request, auth, response }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    const payload = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
    })
    user.merge(payload)
    await user.save()

    return response.redirect().back()
  }

  async uploadAvatar({ request, auth, response, session }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    const image = request.file('avatar', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!image) {
      session.flash('error', 'Aucune image fournie.')
      return response.redirect().back()
    }

    if (!image.isValid) {
      session.flash('error', image.errors[0]?.message ?? 'Image invalide.')
      return response.redirect().back()
    }

    const fileName = `${user.id}-${cuid()}.${image.extname}`
    await image.move(app.makePath('public/uploads/avatars'), {
      name: fileName,
      overwrite: true,
    })

    user.avatar = `/uploads/avatars/${fileName}`
    await user.save()

    session.flash('success', 'Photo de profil mise à jour.')
    return response.redirect().back()
  }

  async requestPasswordReset({ auth, response, session }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    await sendPasswordResetEmail(user)

    session.flash('success', 'Email de réinitialisation envoyé.')
    return response.redirect().back()
  }

  async destroy({ auth, response }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    await auth.use('web').logout()
    await user.delete()

    return response.redirect('/login')
  }
}
