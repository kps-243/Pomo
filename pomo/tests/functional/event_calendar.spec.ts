import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Event from '#models/event'
import Group from '#models/group'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

/**
 * Évènements créés depuis le calendrier (formulaires Inertia) : calendrier
 * personnel ou calendrier partagé d'un groupe.
 */
async function makeGroup(owner: User, members: User[] = []) {
  const group = await Group.create({ name: 'Groupe calendrier', ownerId: owner.id })
  await group.related('members').attach({ [owner.id]: { role: 'owner' } })
  for (const member of members) {
    await group.related('members').attach({ [member.id]: { role: 'member' } })
  }
  await ToDoList.create({ name: group.name, userId: owner.id, groupId: group.id })
  return group
}

const START = '2026-07-15T10:00:00.000Z'
const END = '2026-07-15T11:30:00.000Z'

test.group('Évènements du calendrier', (group) => {
  let owner: User
  let member: User
  let outsider: User

  group.setup(async () => {
    await Event.query().delete()
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Own',
      last_name: 'Er',
      email: 'owner-cal@example.com',
      password: 'password123',
      username: null,
    })
    member = await User.create({
      first_name: 'Mem',
      last_name: 'Ber',
      email: 'member-cal@example.com',
      password: 'password123',
      username: null,
    })
    outsider = await User.create({
      first_name: 'Out',
      last_name: 'Sider',
      email: 'outsider-cal@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await Event.query().delete()
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
  })

  group.teardown(async () => {
    await Event.query().delete()
    await db.from('group_members').delete()
    await ToDoList.query().delete()
    await Group.query().delete()
    await User.query().delete()
  })

  test('un utilisateur crée un évènement dans son calendrier personnel', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/events')
      .loginAs(owner)
      .redirects(0)
      .json({ title: 'Cours de M1', start_date: START, end_date: END, location: 'Amphi B' })

    response.assertStatus(302)
    const event = await Event.query().where('user_id', owner.id).firstOrFail()
    assert.equal(event.title, 'Cours de M1')
    assert.isNull(event.groupId)
    assert.equal(event.end_date!.toUTC().toISO(), DateTime.fromISO(END).toUTC().toISO())
  })

  test('la création échoue sans date de fin', async ({ client, assert }) => {
    const response = await client
      .post('/events')
      .loginAs(owner)
      .accept('json')
      .json({ title: 'Sans fin', start_date: START })

    response.assertStatus(422)
    assert.lengthOf(await Event.all(), 0)
  })

  test('la création échoue si la fin précède le début', async ({ client, assert }) => {
    const response = await client
      .post('/events')
      .loginAs(owner)
      .redirects(0)
      .json({ title: 'Inversé', start_date: END, end_date: START })

    response.assertStatus(302)
    assert.lengthOf(await Event.all(), 0)
  })

  test('la création est refusée sans authentification', async ({ client, assert }) => {
    const response = await client
      .post('/events')
      .accept('json')
      .json({ title: 'Anonyme', start_date: START, end_date: END })

    response.assertStatus(401)
    assert.lengthOf(await Event.all(), 0)
  })

  test('tout membre du groupe peut ajouter un évènement au calendrier partagé', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner, [member])

    const response = await client
      .post(`/groups/${g.id}/events`)
      .loginAs(member)
      .redirects(0)
      .json({ title: 'Réunion équipe', start_date: START, end_date: END })

    response.assertStatus(302)
    const event = await Event.query().where('group_id', g.id).firstOrFail()
    assert.equal(event.userId, member.id)
    assert.equal(event.title, 'Réunion équipe')
  })

  test('un non-membre ne peut pas ajouter d’évènement au calendrier partagé', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner)

    const response = await client
      .post(`/groups/${g.id}/events`)
      .loginAs(outsider)
      .accept('json')
      .json({ title: 'Intrus', start_date: START, end_date: END })

    response.assertStatus(404)
    assert.lengthOf(await Event.all(), 0)
  })

  test('le créateur peut modifier son évènement', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'Ancien',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: null,
    })

    const response = await client
      .put(`/events/${event.id}`)
      .loginAs(owner)
      .redirects(0)
      .json({ title: 'Nouveau' })

    response.assertStatus(302)
    await event.refresh()
    assert.equal(event.title, 'Nouveau')
    assert.equal(event.start_date.toUTC().toISO(), DateTime.fromISO(START).toUTC().toISO())
  })

  test('le propriétaire du groupe peut modifier l’évènement d’un membre', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner, [member])
    const event = await Event.create({
      title: 'Créé par le membre',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: member.id,
      groupId: g.id,
    })

    const response = await client
      .put(`/events/${event.id}`)
      .loginAs(owner)
      .redirects(0)
      .json({ title: 'Renommé par le propriétaire' })

    response.assertStatus(302)
    await event.refresh()
    assert.equal(event.title, 'Renommé par le propriétaire')
  })

  test('un membre ne peut pas modifier l’évènement d’un autre membre', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner, [member, outsider])
    const event = await Event.create({
      title: 'Pas touche',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: member.id,
      groupId: g.id,
    })

    const response = await client
      .put(`/events/${event.id}`)
      .loginAs(outsider)
      .accept('json')
      .json({ title: 'Hack' })

    response.assertStatus(404)
    await event.refresh()
    assert.equal(event.title, 'Pas touche')
  })

  test('la modification refuse un créneau inversé', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'Créneau',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: null,
    })

    const response = await client
      .put(`/events/${event.id}`)
      .loginAs(owner)
      .redirects(0)
      .json({ end_date: '2026-07-15T09:00:00.000Z' })

    response.assertStatus(302)
    await event.refresh()
    assert.equal(event.end_date!.toUTC().toISO(), DateTime.fromISO(END).toUTC().toISO())
  })

  test('le créateur peut supprimer son évènement', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'À supprimer',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: null,
    })

    const response = await client.delete(`/events/${event.id}`).loginAs(owner).redirects(0)

    response.assertStatus(302)
    assert.isNull(await Event.find(event.id))
  })

  test('un autre utilisateur ne peut pas supprimer l’évènement', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'Indestructible',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: null,
    })

    const response = await client.delete(`/events/${event.id}`).loginAs(outsider).accept('json')

    response.assertStatus(404)
    assert.isNotNull(await Event.find(event.id))
  })

  test('le flux iCal contient les évènements personnels et ceux des groupes', async ({
    client,
    assert,
  }) => {
    const g = await makeGroup(owner, [member])
    await Event.create({
      title: 'Perso du membre',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: member.id,
      groupId: null,
    })
    await Event.create({
      title: 'Réunion du groupe',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: g.id,
    })
    await Event.create({
      title: 'Perso du propriétaire',
      start_date: DateTime.fromISO(START),
      end_date: DateTime.fromISO(END),
      userId: owner.id,
      groupId: null,
    })

    const token = await member.ensureCalendarToken()
    const response = await client.get(`/calendar/${token}/feed.ics`)

    response.assertStatus(200)
    const ics = response.text()
    assert.include(ics, 'Perso du membre')
    assert.include(ics, 'Réunion du groupe')
    assert.notInclude(ics, 'Perso du propriétaire')
  })
})
