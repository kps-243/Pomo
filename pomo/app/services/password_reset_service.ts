import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import PasswordResetMail from '#mails/password_reset_mail'
import { generateToken, hashToken } from '#services/secure_token'

const RESET_TOKEN_EXPIRY_HOURS = 1

/**
 * Crée un token de réinitialisation pour l'utilisateur et envoie le mail
 * correspondant. Les tokens précédents non utilisés sont invalidés pour
 * qu'un seul lien reste valide à la fois (même logique de rotation que
 * les invitations de groupe).
 */
export async function sendPasswordResetEmail(user: User): Promise<void> {
  await PasswordResetToken.query().where('user_id', user.id).whereNull('used_at').update({
    usedAt: DateTime.now(),
  })

  const token = generateToken()
  await PasswordResetToken.create({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: DateTime.now().plus({ hours: RESET_TOKEN_EXPIRY_HOURS }),
  })

  const resetUrl = `${env.get('APP_URL')}/password/reset/${token}`
  await mail.send(new PasswordResetMail(user, resetUrl))
}

export function findValidResetToken(token: string): Promise<PasswordResetToken | null> {
  return PasswordResetToken.query()
    .where('token_hash', hashToken(token))
    .whereNull('used_at')
    .where('expires_at', '>', DateTime.now().toSQL())
    .preload('user')
    .first()
}

/**
 * Consomme le token et applique le nouveau mot de passe. Le hachage est géré
 * automatiquement par `AuthFinder` lors du `save()` du modèle `User`.
 */
export async function consumeResetToken(
  resetToken: PasswordResetToken,
  newPassword: string
): Promise<void> {
  resetToken.user.password = newPassword
  await resetToken.user.save()

  resetToken.usedAt = DateTime.now()
  await resetToken.save()
}
