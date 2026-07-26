import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import GroupInvitation from '#models/group_invitation'
import ToDoList from '#models/to_do_list'
import User from '#models/user'
import { createOrRefreshInvitation } from '#services/group_invitation_service'

/**
 * Crée un groupe façon controller : groupe + pivot du propriétaire +
 * todolist partagée, comme dans tests/functional/group.spec.ts.
 */
async function makeGroup(owner: User) {
  const group = await Group.create({ name: 'Groupe test', description: null, ownerId: owner.id })
  await group.related('members').attach({ [owner.id]: { role: 'owner' } })
  await ToDoList.create({ name: group.name, userId: owner.id, groupId: group.id })
  return group
}

function isMember(groupId: number, userId: number) {
  return db.from('group_members').where('group_id', groupId).where('user_id', userId).first()
}

test.group('Group invitations', (group) => {
  let owner: User
  let existingUser: User
  let outsider: User

  group.setup(async () => {
    await db.from('group_members').delete()
    await GroupInvitation.query().delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Own',
      last_name: 'Er',
      email: 'owner-inv@example.com',
      password: 'password123',
      username: null,
    })
    existingUser = await User.create({
      first_name: 'Existing',
      last_name: 'User',
      email: 'existing-inv@example.com',
      password: 'password123',
      username: null,
    })
    outsider = await User.create({
      first_name: 'Out',
      last_name: 'Sider',
      email: 'outsider-inv@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await db.from('group_members').delete()
    await GroupInvitation.query().delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    mail.fake()
    return () => mail.restore()
  })

  group.teardown(async () => {
    await db.from('group_members').delete()
    await GroupInvitation.query().delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()
  })

  test("ré-inviter la même adresse avant expiration réutilise l'invitation (pas de doublon)", async ({
    assert,
  }) => {
    const g = await makeGroup(owner)

    const first = await createOrRefreshInvitation({
      group: g,
      email: 'invitee@example.com',
      invitedBy: owner,
    })
    const second = await createOrRefreshInvitation({
      group: g,
      email: 'invitee@example.com',
      invitedBy: owner,
    })

    assert.notEqual(first.token, second.token)
    assert.equal(first.invitation.id, second.invitation.id)

    const pending = await GroupInvitation.query()
      .where('group_id', g.id)
      .where('email', 'invitee@example.com')
      .where('status', 'pending')
    assert.lengthOf(pending, 1)
  })

  test('un compte existant avec le bon email accepte et rejoint le groupe', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: existingUser.email,
      invitedBy: owner,
    })

    const response = await client
      .post(`/invitations/${token}/accept`)
      .loginAs(existingUser)
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', `/groups/${g.id}`)
    assert.isTrue(Boolean(await isMember(g.id, existingUser.id)))

    const invitation = await GroupInvitation.query()
      .where('group_id', g.id)
      .where('email', existingUser.email)
      .firstOrFail()
    assert.equal(invitation.status, 'accepted')
    assert.isNotNull(invitation.acceptedAt)
  })

  test('un compte connecté avec un email différent de celui invité ne peut pas accepter', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: existingUser.email,
      invitedBy: owner,
    })

    const response = await client
      .post(`/invitations/${token}/accept`)
      .loginAs(outsider)
      .redirects(0)

    response.assertStatus(302)
    assert.isFalse(Boolean(await isMember(g.id, outsider.id)))

    const invitation = await GroupInvitation.query()
      .where('group_id', g.id)
      .where('email', existingUser.email)
      .firstOrFail()
    assert.equal(invitation.status, 'pending')
  })

  test('un token expiré ne peut plus être accepté', async ({ client, assert }) => {
    const g = await makeGroup(owner)
    const { invitation, token } = await createOrRefreshInvitation({
      group: g,
      email: existingUser.email,
      invitedBy: owner,
    })
    invitation.expiresAt = DateTime.now().minus({ days: 1 })
    await invitation.save()

    const response = await client
      .post(`/invitations/${token}/accept`)
      .loginAs(existingUser)
      .redirects(0)

    response.assertStatus(302)
    assert.isFalse(Boolean(await isMember(g.id, existingUser.id)))

    await invitation.refresh()
    assert.equal(invitation.status, 'expired')
  })

  test('un token déjà accepté ne peut pas être réutilisé une seconde fois', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: existingUser.email,
      invitedBy: owner,
    })

    await client.post(`/invitations/${token}/accept`).loginAs(existingUser).redirects(0)
    const countAfterFirst = await db
      .from('group_members')
      .where('group_id', g.id)
      .count('* as total')
      .first()

    const secondResponse = await client
      .post(`/invitations/${token}/accept`)
      .loginAs(existingUser)
      .redirects(0)
    secondResponse.assertStatus(302)

    const countAfterSecond = await db
      .from('group_members')
      .where('group_id', g.id)
      .count('* as total')
      .first()
    assert.deepEqual(countAfterFirst, countAfterSecond)
  })

  test('un token inconnu ne peut pas être accepté', async ({ client }) => {
    const response = await client
      .post('/invitations/token-inconnu/accept')
      .loginAs(existingUser)
      .redirects(0)

    response.assertStatus(302)
  })

  test("la page d'invitation est accessible sans être connecté", async ({ client }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: 'nouveau-venu@example.com',
      invitedBy: owner,
    })

    const response = await client.get(`/invitations/${token}`)
    response.assertStatus(200)
  })

  test("un visiteur sans compte qui s'inscrit avec le token en session rejoint automatiquement le groupe", async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: 'newcomer@example.com',
      invitedBy: owner,
    })

    const response = await client
      .post('/register')
      .withSession({ pending_invitation_token: token })
      .redirects(0)
      .json({
        first_name: 'New',
        last_name: 'Comer',
        email: 'newcomer@example.com',
        password: 'password123',
        username: null,
      })

    response.assertStatus(302)
    response.assertHeader('location', `/groups/${g.id}`)

    const newUser = await User.findByOrFail('email', 'newcomer@example.com')
    assert.isTrue(Boolean(await isMember(g.id, newUser.id)))

    const invitation = await GroupInvitation.query()
      .where('group_id', g.id)
      .where('email', 'newcomer@example.com')
      .firstOrFail()
    assert.equal(invitation.status, 'accepted')
  })

  test('un visiteur avec un compte existant qui se connecte avec le token en session rejoint automatiquement le groupe', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const { token } = await createOrRefreshInvitation({
      group: g,
      email: existingUser.email,
      invitedBy: owner,
    })

    const response = await client
      .post('/login')
      .withSession({ pending_invitation_token: token })
      .redirects(0)
      .json({ email: existingUser.email, password: 'password123' })

    response.assertStatus(302)
    response.assertHeader('location', `/groups/${g.id}`)
    assert.isTrue(Boolean(await isMember(g.id, existingUser.id)))
  })
})
