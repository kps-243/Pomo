import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

const ISSUER = 'Pomo'

function makeTotp(email: string, secret: OTPAuth.Secret | string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: typeof secret === 'string' ? OTPAuth.Secret.fromBase32(secret) : secret,
  })
}

export default class TwoFactorController {
  // ─── Login flow ───────────────────────────────────────────────────────────

  showVerify({ inertia, session, response }: HttpContext) {
    if (!session.get('two_factor_pending_user_id')) {
      return response.redirect('/login')
    }
    return inertia.render('Auth/TwoFactor', { error: null })
  }

  async verify({ request, response, auth, session, inertia }: HttpContext) {
    const pendingUserId = session.get('two_factor_pending_user_id')
    if (!pendingUserId) return response.redirect('/login')

    const user = await User.find(pendingUserId)
    if (!user?.twoFactorSecret) return response.redirect('/login')

    const { code } = request.only(['code'])
    const totp = makeTotp(user.email, user.twoFactorSecret)
    const isValid = totp.validate({ token: (code ?? '').replace(/\s/g, ''), window: 1 }) !== null

    if (!isValid) {
      return inertia.render('Auth/TwoFactor', { error: 'Code invalide. Veuillez réessayer.' })
    }

    session.forget('two_factor_pending_user_id')
    await auth.use('web').login(user)
    return response.redirect('/')
  }

  // ─── Setup flow ───────────────────────────────────────────────────────────

  async showSetup({ inertia, auth, session }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    if (user.twoFactorEnabled) {
      return inertia.render('Settings/Security', { twoFactorEnabled: true })
    }

    const secret = new OTPAuth.Secret({ size: 20 })
    const totp = makeTotp(user.email, secret)
    const qrCode = await QRCode.toDataURL(totp.toString())

    session.put('two_factor_setup_secret', secret.base32)

    return inertia.render('Auth/TwoFactorSetup', { qrCode, secret: secret.base32, error: null })
  }

  async enable({ request, response, auth, session, inertia }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)

    const setupSecret = session.get('two_factor_setup_secret')
    if (!setupSecret) return response.redirect('/two-factor/setup')

    const { code } = request.only(['code'])
    const totp = makeTotp(user.email, setupSecret)
    const isValid = totp.validate({ token: (code ?? '').replace(/\s/g, ''), window: 1 }) !== null

    if (!isValid) {
      const qrCode = await QRCode.toDataURL(totp.toString())
      return inertia.render('Auth/TwoFactorSetup', {
        qrCode,
        secret: setupSecret,
        error: 'Code invalide. Veuillez réessayer.',
      })
    }

    user.twoFactorSecret = setupSecret
    user.twoFactorEnabled = true
    await user.save()
    session.forget('two_factor_setup_secret')
    return response.redirect('/settings/security')
  }

  async disable({ auth, response }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)
    user.twoFactorEnabled = false
    user.twoFactorSecret = null
    await user.save()
    return response.redirect('/settings/security')
  }

  // ─── Settings page ────────────────────────────────────────────────────────

  async securityPage({ inertia, auth }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)
    return inertia.render('Settings/Security', { twoFactorEnabled: user.twoFactorEnabled })
  }
}
