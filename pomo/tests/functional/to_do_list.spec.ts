import { test } from '@japa/runner'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

test.group('ToDoLists CRUD', (group) => {
  let owner: User
  let otherUser: User

  group.setup(async () => {
    await ToDoList.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Owner',
      last_name: 'User',
      email: 'owner-todolists@example.com',
      password: 'password123',
      username: null,
    })

    otherUser = await User.create({
      first_name: 'Other',
      last_name: 'User',
      email: 'other-todolists@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await ToDoList.query().delete()
  })

  group.teardown(async () => {
    await ToDoList.query().delete()
    await User.query().delete()
  })

  test('un utilisateur connecté peut créer une todolist', async ({ client }) => {
    const response = await client
      .post('/api/todolists')
      .loginAs(owner)
      .json({ name: 'Ma première liste' })

    response.assertStatus(201)
    response.assertBodyContains({ toDoList: { name: 'Ma première liste', userId: owner.id } })
  })

  test('un utilisateur non connecté ne peut pas créer de todolist', async ({ client }) => {
    const response = await client.post('/api/todolists').accept('json').json({ name: 'Anonyme' })

    response.assertStatus(401)
  })

  test('la création échoue si le nom est vide', async ({ client }) => {
    const response = await client
      .post('/api/todolists')
      .loginAs(owner)
      .accept('json')
      .json({ name: '' })

    response.assertStatus(422)
  })

  test('index ne retourne que les todolists de l’utilisateur connecté', async ({
    client,
    assert,
  }) => {
    await ToDoList.create({ name: 'À moi', userId: owner.id })
    await ToDoList.create({ name: 'À l’autre', userId: otherUser.id })

    const response = await client.get('/api/todolists').loginAs(owner)

    response.assertStatus(200)
    response.assertBodyContains([{ name: 'À moi', userId: owner.id }])
    assert.lengthOf(response.body(), 1)
  })

  test('un utilisateur peut voir sa propre todolist', async ({ client }) => {
    const list = await ToDoList.create({ name: 'Visible', userId: owner.id })

    const response = await client.get(`/api/todolists/${list.id}`).loginAs(owner)

    response.assertStatus(200)
    response.assertBodyContains({ id: list.id, name: 'Visible' })
  })

  test('un utilisateur ne peut pas voir la todolist d’un autre', async ({ client }) => {
    const list = await ToDoList.create({ name: 'Privée', userId: owner.id })

    const response = await client.get(`/api/todolists/${list.id}`).loginAs(otherUser).accept('json')

    response.assertStatus(404)
  })

  test('un utilisateur peut modifier sa propre todolist', async ({ client }) => {
    const list = await ToDoList.create({ name: 'Ancien nom', userId: owner.id })

    const response = await client
      .put(`/api/todolists/${list.id}`)
      .loginAs(owner)
      .json({ name: 'Nouveau nom' })

    response.assertStatus(200)
    response.assertBodyContains({ toDoList: { name: 'Nouveau nom' } })
  })

  test('un utilisateur ne peut pas modifier la todolist d’un autre ', async ({
    client,
    assert,
  }) => {
    const list = await ToDoList.create({ name: 'Pas touche', userId: owner.id })

    const response = await client
      .put(`/api/todolists/${list.id}`)
      .loginAs(otherUser)
      .accept('json')
      .json({ name: 'Hack' })

    response.assertStatus(404)
    await list.refresh()
    assert.equal(list.name, 'Pas touche')
  })

  test('un utilisateur peut supprimer sa propre todolist', async ({ client, assert }) => {
    const list = await ToDoList.create({ name: 'À supprimer', userId: owner.id })

    const response = await client.delete(`/api/todolists/${list.id}`).loginAs(owner)

    response.assertStatus(200)
    assert.isNull(await ToDoList.find(list.id))
  })

  test('un utilisateur ne peut pas supprimer la todolist d’un autre', async ({
    client,
    assert,
  }) => {
    const list = await ToDoList.create({ name: 'Indestructible', userId: owner.id })

    const response = await client
      .delete(`/api/todolists/${list.id}`)
      .loginAs(otherUser)
      .accept('json')

    response.assertStatus(404)
    assert.isNotNull(await ToDoList.find(list.id))
  })
})
