import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Event from '#models/event'
import User from '#models/user'

test.group('Events CRUD', (group) => {
  let owner: User
  let otherUser: User

  group.setup(async () => {
    await Event.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Owner',
      last_name: 'User',
      email: 'owner-events@example.com',
      password: 'password123',
      username: null,
    })

    otherUser = await User.create({
      first_name: 'Other',
      last_name: 'User',
      email: 'other-events@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await Event.query().delete()
  })

  group.teardown(async () => {
    await Event.query().delete()
    await User.query().delete()
  })

  test('un utilisateur connecté peut créer un event', async ({ client }) => {
    const response = await client
      .post('/api/events')
      .loginAs(owner)
      .json({ title: 'Réunion', start_date: '2026-07-15T10:00:00' })

    response.assertStatus(201)
    response.assertBodyContains({ event: { title: 'Réunion', userId: owner.id } })
  })

  test('un utilisateur non connecté ne peut pas créer d’event', async ({ client }) => {
    const response = await client
      .post('/api/events')
      .accept('json')
      .json({ title: 'Anonyme', start_date: '2026-07-15T10:00:00' })

    response.assertStatus(401)
  })

  test('la création échoue si le titre est manquant', async ({ client }) => {
    const response = await client
      .post('/api/events')
      .loginAs(owner)
      .accept('json')
      .json({ start_date: '2026-07-15T10:00:00' })

    response.assertStatus(422)
  })

  test('la création échoue si la date de début est manquante', async ({ client }) => {
    const response = await client
      .post('/api/events')
      .loginAs(owner)
      .accept('json')
      .json({ title: 'Sans date' })

    response.assertStatus(422)
  })

  test('index ne retourne que les events de l’utilisateur connecté', async ({ client, assert }) => {
    await Event.create({ title: 'À moi', userId: owner.id, start_date: DateTime.now() })
    await Event.create({ title: 'À l’autre', userId: otherUser.id, start_date: DateTime.now() })

    const response = await client.get('/api/events').loginAs(owner)

    response.assertStatus(200)
    response.assertBodyContains([{ title: 'À moi', userId: owner.id }])
    assert.lengthOf(response.body(), 1)
  })

  test('un utilisateur peut voir son propre event', async ({ client }) => {
    const event = await Event.create({
      title: 'Visible',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client.get(`/api/events/${event.id}`).loginAs(owner)

    response.assertStatus(200)
    response.assertBodyContains({ id: event.id, title: 'Visible' })
  })

  test('un utilisateur ne peut pas voir l’event d’un autre', async ({ client }) => {
    const event = await Event.create({
      title: 'Privé',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client.get(`/api/events/${event.id}`).loginAs(otherUser).accept('json')

    response.assertStatus(404)
  })

  test('un utilisateur peut modifier son propre event', async ({ client }) => {
    const event = await Event.create({
      title: 'Ancien',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client
      .put(`/api/events/${event.id}`)
      .loginAs(owner)
      .json({ title: 'Nouveau' })

    response.assertStatus(200)
    response.assertBodyContains({ event: { title: 'Nouveau' } })
  })

  test('un utilisateur ne peut pas modifier l’event d’un autre', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'Pas touche',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client
      .put(`/api/events/${event.id}`)
      .loginAs(otherUser)
      .accept('json')
      .json({ title: 'Hack' })

    response.assertStatus(404)
    await event.refresh()
    assert.equal(event.title, 'Pas touche')
  })

  test('un utilisateur peut supprimer son propre event', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'À supprimer',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client.delete(`/api/events/${event.id}`).loginAs(owner)

    response.assertStatus(200)
    assert.isNull(await Event.find(event.id))
  })

  test('un utilisateur ne peut pas supprimer l’event d’un autre', async ({ client, assert }) => {
    const event = await Event.create({
      title: 'Indestructible',
      userId: owner.id,
      start_date: DateTime.now(),
    })

    const response = await client
      .delete(`/api/events/${event.id}`)
      .loginAs(otherUser)
      .accept('json')

    response.assertStatus(404)
    assert.isNotNull(await Event.find(event.id))
  })
})
