import { test } from '@japa/runner'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

test.group('Réordonnancement des tasks (board)', (group) => {
  let owner: User
  let other: User
  let list: ToDoList
  let autreList: ToDoList
  let tasks: Task[]

  const ordreEnBase = async (toDoListId: number) => {
    const rangees = await Task.query()
      .where('to_do_list_id', toDoListId)
      .orderBy('position', 'asc')
      .orderBy('id', 'asc')
    return rangees.map((task) => task.title)
  }

  group.setup(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()

    owner = await User.create({
      first_name: 'Owner',
      last_name: 'Reorder',
      email: 'owner-reorder@example.com',
      password: 'password123',
      username: null,
    })
    other = await User.create({
      first_name: 'Other',
      last_name: 'Reorder',
      email: 'other-reorder@example.com',
      password: 'password123',
      username: null,
    })
  })

  group.each.setup(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()

    list = await ToDoList.create({ name: 'Liste du owner', userId: owner.id })
    autreList = await ToDoList.create({ name: 'Autre liste du owner', userId: owner.id })

    tasks = []
    for (const [index, title] of ['A', 'B', 'C'].entries()) {
      tasks.push(await list.related('tasks').create({ title, position: index, userId: owner.id }))
    }
  })

  group.teardown(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()
  })

  test('le propriétaire réordonne les tasks de sa todolist', async ({ client, assert }) => {
    const [a, b, c] = tasks
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .redirects(0)
      .json({ taskIds: [c.id, a.id, b.id] })

    response.assertStatus(302)
    assert.deepEqual(await ordreEnBase(list.id), ['C', 'A', 'B'])
  })

  test('les positions sont réécrites de 0 à n sans trou ni doublon', async ({ client, assert }) => {
    const [a, b, c] = tasks
    await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .json({ taskIds: [b.id, c.id, a.id] })

    const positions = await Task.query().where('to_do_list_id', list.id).orderBy('position', 'asc')
    assert.deepEqual(
      positions.map((task) => task.position),
      [0, 1, 2]
    )
  })

  test('un ordre partiel est refusé et ne modifie rien', async ({ client, assert }) => {
    const [a, b] = tasks
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .accept('json')
      .json({ taskIds: [b.id, a.id] })

    response.assertStatus(422)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C'])
  })

  test('un ordre contenant un doublon est refusé', async ({ client, assert }) => {
    const [, b, c] = tasks
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .accept('json')
      .json({ taskIds: [b.id, b.id, c.id] })

    response.assertStatus(422)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C'])
  })

  test('un ordre mêlant la task d’une autre liste est refusé', async ({ client, assert }) => {
    const [a, b] = tasks
    const intruse = await autreList.related('tasks').create({ title: 'Intruse', userId: owner.id })

    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .accept('json')
      .json({ taskIds: [a.id, b.id, intruse.id] })

    response.assertStatus(422)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C'])
  })

  test('on ne peut pas réordonner la todolist d’un autre', async ({ client, assert }) => {
    const [a, b, c] = tasks
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(other)
      .accept('json')
      .json({ taskIds: [c.id, b.id, a.id] })

    response.assertStatus(404)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C'])
  })

  test('un utilisateur non connecté ne peut pas réordonner', async ({ client, assert }) => {
    const [a, b, c] = tasks
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .accept('json')
      .json({ taskIds: [c.id, b.id, a.id] })

    response.assertStatus(401)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C'])
  })

  test('un payload vide est refusé', async ({ client }) => {
    const response = await client
      .put(`/todolists/${list.id}/tasks/reorder`)
      .loginAs(owner)
      .accept('json')
      .json({ taskIds: [] })

    response.assertStatus(422)
  })

  test('une nouvelle task est créée en fin de liste', async ({ client, assert }) => {
    const response = await client
      .post(`/todolists/${list.id}/tasks`)
      .loginAs(owner)
      .redirects(0)
      .json({ title: 'D' })

    response.assertStatus(302)
    assert.deepEqual(await ordreEnBase(list.id), ['A', 'B', 'C', 'D'])

    const creee = await Task.findByOrFail('title', 'D')
    assert.equal(creee.position, 3)
  })

  test('la première task d’une liste vide prend la position 0', async ({ client, assert }) => {
    await client.post(`/todolists/${autreList.id}/tasks`).loginAs(owner).json({ title: 'Seule' })

    const creee = await Task.findByOrFail('title', 'Seule')
    assert.equal(creee.position, 0)
  })
})
