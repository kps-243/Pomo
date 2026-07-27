import { test } from '@japa/runner'
import mail from '@adonisjs/mail/services/main'
import { FakeMailer } from '@adonisjs/mail'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import PasswordResetMail from '#mails/password_reset_mail'

async function createUser(overrides: Partial<Record<string, unknown>> = {}) {
  return User.create({
    first_name: 'Profile',
    last_name: 'Owner',
    email: 'profile-owner@example.com',
    password: 'password123',
    username: null,
    ...overrides,
  })
}

test.group('Profile', (group) => {
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

  test('affiche les informations du profil', async ({ client }) => {
    const response = await client.get('/settings/profile').withInertia().loginAs(user)
    response.assertStatus(200)
    response.assertInertiaPropsContains({ profile: { email: user.email } })
  })

  test('redirige les visiteurs non connectés vers /login', async ({ client }) => {
    const response = await client.get('/settings/profile').redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })

  test('met à jour les informations personnelles', async ({ client, assert }) => {
    const response = await client
      .put('/settings/profile')
      .loginAs(user)
      .json({
        username: 'updated',
        first_name: 'Updated',
        last_name: 'Name',
        email: 'updated@example.com',
      })
      .redirects(0)

    response.assertStatus(302)

    const updated = await User.findOrFail(user.id)
    assert.equal(updated.first_name, 'Updated')
    assert.equal(updated.email, 'updated@example.com')
  })

  test('échoue si le prénom est manquant', async ({ client }) => {
    const response = await client
      .put('/settings/profile')
      .loginAs(user)
      .accept('json')
      .json({ username: null, first_name: '', last_name: 'Name', email: user.email })

    response.assertStatus(422)
  })

  test("échoue si l'email est déjà utilisé par un autre compte", async ({ client }) => {
    const other = await createUser({ email: 'other@example.com' })

    const response = await client.put('/settings/profile').loginAs(user).accept('json').json({
      username: null,
      first_name: user.first_name,
      last_name: user.last_name,
      email: other.email,
    })

    response.assertStatus(422)
  })

  test('conserve son propre email lors de la mise à jour', async ({ client }) => {
    const response = await client
      .put('/settings/profile')
      .loginAs(user)
      .json({
        username: null,
        first_name: 'Same',
        last_name: user.last_name,
        email: user.email,
      })
      .redirects(0)

    response.assertStatus(302)
  })

  test('envoie un email de réinitialisation de mot de passe', async ({ client, assert }) => {
    const response = await client
      .post('/settings/profile/password-reset')
      .loginAs(user)
      .redirects(0)

    response.assertStatus(302)

    fakeMailer.mails.assertSent(PasswordResetMail, (m: PasswordResetMail) => m.user.id === user.id)

    const tokens = await PasswordResetToken.query().where('user_id', user.id)
    assert.lengthOf(tokens, 1)
  })

  test("supprime le compte et déconnecte l'utilisateur", async ({ client, assert }) => {
    const response = await client.delete('/settings/profile').loginAs(user).redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/login')

    const deleted = await User.find(user.id)
    assert.isNull(deleted)

    // A stale session referencing the now-deleted user can no longer authenticate.
    const afterDelete = await client.get('/settings/profile').loginAs(user).redirects(0)
    afterDelete.assertStatus(302)
    afterDelete.assertHeader('location', '/login')
  })
})
