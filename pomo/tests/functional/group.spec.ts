import { test } from '@japa/runner'
import Group from '#models/group'
import ToDoList from '#models/to_do_list'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

/**
 * Crée un groupe façon controller : groupe + pivot des membres (propriétaire avec
 * le rôle owner) + todolist partagée portant le nom du groupe.
 */
async function makeGroup(owner: User, members: User[] = []) {
  const group = await Group.create({ name: 'Groupe test', description: 'desc', ownerId: owner.id })
  await group.related('members').attach({ [owner.id]: { role: 'owner' } })
  for (const member of members) {
    await group.related('members').attach({ [member.id]: { role: 'member' } })
  }
  await ToDoList.create({ name: group.name, userId: owner.id, groupId: group.id })
  return group
}

function memberCount(groupId: number) {
  return db.from('group_members').where('group_id', groupId).count('* as total').first()
}

async function isMember(groupId: number, userId: number) {
  const row = await db
    .from('group_members')
    .where('group_id', groupId)
    .where('user_id', userId)
    .first()
  return Boolean(row)
}

test.group('Groups', (group) => {
  let owner: User
  let member: User
  let outsider: User

  group.setup(async () => {
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Own',
      last_name: 'Er',
      email: 'owner-grp@example.com',
      password: 'password123',
      username: null,
    })
    member = await User.create({
      first_name: 'Mem',
      last_name: 'Ber',
      email: 'member-grp@example.com',
      password: 'password123',
      username: null,
    })
    outsider = await User.create({
      first_name: 'Out',
      last_name: 'Sider',
      email: 'outsider-grp@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
  })

  group.teardown(async () => {
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()
  })

  test('un utilisateur crée un groupe, en devient propriétaire et obtient une todolist partagée', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/groups')
      .loginAs(owner)
      .redirects(0)
      .json({ name: 'Mon groupe', description: 'Une description' })

    response.assertStatus(302)
    const created = await Group.query().where('owner_id', owner.id).firstOrFail()
    assert.equal(created.name, 'Mon groupe')

    const pivot = await db
      .from('group_members')
      .where('group_id', created.id)
      .where('user_id', owner.id)
      .first()
    assert.equal(pivot.role, 'owner')

    const list = await ToDoList.query().where('group_id', created.id).first()
    assert.isNotNull(list)
    assert.equal(list!.name, 'Mon groupe')
  })

  test('la création est refusée sans authentification', async ({ client, assert }) => {
    const response = await client.post('/groups').accept('json').json({ name: 'X' })
    response.assertStatus(401)
    assert.lengthOf(await Group.all(), 0)
  })

  test('le propriétaire invite un membre existant', async ({ client, assert }) => {
    const g = await makeGroup(owner)
    const response = await client
      .post(`/groups/${g.id}/invite`)
      .loginAs(owner)
      .redirects(0)
      .json({ email: member.email })

    response.assertStatus(302)
    assert.isTrue(await isMember(g.id, member.id))
  })

  test("l'invitation d'un email inconnu n'ajoute personne", async ({ client, assert }) => {
    const g = await makeGroup(owner)
    const before = await memberCount(g.id)

    const response = await client
      .post(`/groups/${g.id}/invite`)
      .loginAs(owner)
      .redirects(0)
      .json({ email: 'inconnu@nowhere.com' })

    response.assertStatus(302)
    assert.deepEqual(await memberCount(g.id), before)
  })

  test('inviter un membre déjà présent ne crée pas de doublon', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const before = await memberCount(g.id)

    const response = await client
      .post(`/groups/${g.id}/invite`)
      .loginAs(owner)
      .redirects(0)
      .json({ email: member.email })

    response.assertStatus(302)
    assert.deepEqual(await memberCount(g.id), before)
  })

  test('un non-propriétaire ne peut pas inviter', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client
      .post(`/groups/${g.id}/invite`)
      .loginAs(member)
      .accept('json')
      .json({ email: outsider.email })

    response.assertStatus(404)
    assert.isFalse(await isMember(g.id, outsider.id))
  })

  test('le propriétaire retire un membre', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client
      .delete(`/groups/${g.id}/members/${member.id}`)
      .loginAs(owner)
      .redirects(0)

    response.assertStatus(302)
    assert.isFalse(await isMember(g.id, member.id))
  })

  test('le propriétaire ne peut pas se retirer lui-même', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client
      .delete(`/groups/${g.id}/members/${owner.id}`)
      .loginAs(owner)
      .redirects(0)

    response.assertStatus(302)
    assert.isTrue(await isMember(g.id, owner.id))
  })

  test('un membre peut quitter le groupe', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client.post(`/groups/${g.id}/leave`).loginAs(member).redirects(0)

    response.assertStatus(302)
    assert.isFalse(await isMember(g.id, member.id))
  })

  test('le propriétaire ne peut pas quitter son groupe', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client.post(`/groups/${g.id}/leave`).loginAs(owner).redirects(0)

    response.assertStatus(302)
    assert.isTrue(await isMember(g.id, owner.id))
  })

  test('le propriétaire renomme le groupe et la todolist partagée suit', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)
    const response = await client
      .put(`/groups/${g.id}`)
      .loginAs(owner)
      .redirects(0)
      .json({ name: 'Renommé' })

    response.assertStatus(302)
    await g.refresh()
    assert.equal(g.name, 'Renommé')

    const list = await ToDoList.query().where('group_id', g.id).firstOrFail()
    assert.equal(list.name, 'Renommé')
  })

  test('un non-propriétaire ne peut pas modifier le groupe', async ({ client }) => {
    const g = await makeGroup(owner, [member])
    const response = await client
      .put(`/groups/${g.id}`)
      .loginAs(member)
      .accept('json')
      .json({ name: 'Hack' })

    response.assertStatus(404)
  })

  test('un non-membre ne peut pas consulter le groupe', async ({ client }) => {
    const g = await makeGroup(owner, [member])
    const response = await client.get(`/groups/${g.id}`).loginAs(outsider).accept('json')
    response.assertStatus(404)
  })

  test('le propriétaire supprime le groupe', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client.delete(`/groups/${g.id}`).loginAs(owner).redirects(0)

    response.assertStatus(302)
    assert.isNull(await Group.find(g.id))
  })

  test('un non-propriétaire ne peut pas supprimer le groupe', async ({ client, assert }) => {
    const g = await makeGroup(owner, [member])
    const response = await client.delete(`/groups/${g.id}`).loginAs(member).accept('json')

    response.assertStatus(404)
    assert.isNotNull(await Group.find(g.id))
  })
})
