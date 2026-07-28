import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import { FakeMailer } from '@adonisjs/mail'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import PasswordResetMail from '#mails/password_reset_mail'
import { hashToken, generateToken } from '#services/secure_token'

async function createUser(overrides: Partial<Record<string, unknown>> = {}) {
  return User.create({
    first_name: 'Reset',
    last_name: 'User',
    email: 'reset-user@example.com',
    password: 'password123',
    username: null,
    ...overrides,
  })
}

test.group('Password reset request', (group) => {
  let user: User
  let fakeMailer: FakeMailer

  group.each.setup(async () => {
    await PasswordResetToken.query().delete()
    await User.query().delete()
    user = await createUser()
    fakeMailer = mail.fake()
    return () => mail.restore()
  })

  group.teardown(async () => {
    await PasswordResetToken.query().delete()
    await User.query().delete()
  })

  test('envoie un email si le compte existe', async ({ client, assert }) => {
    const response = await client.post('/password/forgot').json({ email: user.email }).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')

    fakeMailer.mails.assertSent(PasswordResetMail, (m: PasswordResetMail) => m.user.id === user.id)

    const tokens = await PasswordResetToken.query().where('user_id', user.id)
    assert.lengthOf(tokens, 1)
  })

  test("ne révèle pas si l'email est inconnu (même réponse, aucun mail envoyé)", async ({
    client,
  }) => {
    const response = await client
      .post('/password/forgot')
      .json({ email: 'inconnu@example.com' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')

    fakeMailer.mails.assertNotSent(PasswordResetMail)
  })
})

test.group('Password reset consumption', (group) => {
  let user: User

  group.each.setup(async () => {
    await PasswordResetToken.query().delete()
    await User.query().delete()
    user = await createUser()
  })

  group.teardown(async () => {
    await PasswordResetToken.query().delete()
    await User.query().delete()
  })

  test('un token valide est reconnu par la page de réinitialisation', async ({ client }) => {
    const token = generateToken()
    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const response = await client.get(`/password/reset/${token}`).withInertia()
    response.assertStatus(200)
    response.assertInertiaPropsContains({ valid: true })
  })

  test('un token inconnu est signalé comme invalide', async ({ client }) => {
    const response = await client.get('/password/reset/does-not-exist').withInertia()
    response.assertStatus(200)
    response.assertInertiaPropsContains({ valid: false })
  })

  test('un token expiré est signalé comme invalide', async ({ client }) => {
    const token = generateToken()
    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().minus({ minutes: 1 }),
    })

    const response = await client.get(`/password/reset/${token}`).withInertia()
    response.assertInertiaPropsContains({ valid: false })
  })

  test('change le mot de passe avec un token valide', async ({ client, assert }) => {
    const token = generateToken()
    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const response = await client
      .post(`/password/reset/${token}`)
      .json({ password: 'newpassword123', password_confirmation: 'newpassword123' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')

    const updated = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(updated.password, 'newpassword123'))

    const resetToken = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(resetToken.usedAt)
  })

  test('échoue si la confirmation ne correspond pas', async ({ client }) => {
    const token = generateToken()
    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const response = await client
      .post(`/password/reset/${token}`)
      .accept('json')
      .json({ password: 'newpassword123', password_confirmation: 'mismatch12345' })

    response.assertStatus(422)
  })

  test('un token déjà utilisé ne peut pas resservir', async ({ client, assert }) => {
    const token = generateToken()
    await PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().plus({ hours: 1 }),
      usedAt: DateTime.now(),
    })

    const response = await client
      .post(`/password/reset/${token}`)
      .json({ password: 'anotherpassword', password_confirmation: 'anotherpassword' })
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/password/reset/${token}`)

    const stillOriginal = await User.findOrFail(user.id)
    assert.isTrue(await hash.verify(stillOriginal.password, 'password123'))
  })
})
