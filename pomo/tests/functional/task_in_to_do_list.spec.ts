import { test } from '@japa/runner'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

test.group('Tasks dans une ToDoList', (group) => {
  let owner: User
  let otherUser: User
  let ownerList: ToDoList

  group.setup(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Owner',
      last_name: 'User',
      email: 'owner-tasklist@example.com',
      password: 'password123',
      username: null,
    })
    otherUser = await User.create({
      first_name: 'Other',
      last_name: 'User',
      email: 'other-tasklist@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    ownerList = await ToDoList.create({ name: 'Liste du owner', userId: owner.id })
  })

  group.teardown(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()
  })

  test('le propriétaire peut ajouter une task dans sa todolist', async ({ client }) => {
    const response = await client.post(`/api/todolists/${ownerList.id}/tasks`).loginAs(owner).json({
      title: 'Ma task',
      status: 'todo',
      duration: 25,
      start_date: new Date().toISOString(),
    })

    response.assertStatus(201)
    response.assertBodyContains({
      task: { title: 'Ma task', toDoListId: ownerList.id, userId: owner.id },
    })
  })

  test('on ne peut pas ajouter une task dans la todolist d’un autre', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post(`/api/todolists/${ownerList.id}/tasks`)
      .loginAs(otherUser)
      .accept('json')
      .json({ title: 'Intrus' })

    response.assertStatus(404)
    assert.lengthOf(await Task.all(), 0)
  })

  test('la création échoue si le titre est manquant', async ({ client }) => {
    const response = await client
      .post(`/api/todolists/${ownerList.id}/tasks`)
      .loginAs(owner)
      .accept('json')
      .json({ status: 'todo' })

    response.assertStatus(422)
  })

  test('le propriétaire récupère les tasks de sa todolist', async ({ client, assert }) => {
    await ownerList.related('tasks').create({ title: 'T1', userId: owner.id })
    await ownerList.related('tasks').create({ title: 'T2', userId: owner.id })

    const response = await client.get(`/api/todolists/${ownerList.id}/tasks`).loginAs(owner)

    response.assertStatus(200)
    assert.lengthOf(response.body(), 2)
  })

  test('on ne peut pas récupérer les tasks de la todolist d’un autre', async ({ client }) => {
    const response = await client
      .get(`/api/todolists/${ownerList.id}/tasks`)
      .loginAs(otherUser)
      .accept('json')

    response.assertStatus(404)
  })
})
