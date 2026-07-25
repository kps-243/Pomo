import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import User from '#models/user'

/**
 * Tests d'intégration de la gestion de l'échéance (due_date) d'une task,
 * via l'endpoint PUT /api/tasks/:id (même logique de merge que le board).
 */
test.group('Task due_date (API)', (group) => {
  let owner: User
  let other: User
  let list: ToDoList
  let task: Task

  group.setup(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()
    owner = await User.create({
      first_name: 'Owner',
      last_name: 'Due',
      email: 'owner-due@example.com',
      password: 'password123',
      username: null,
    })
    other = await User.create({
      first_name: 'Other',
      last_name: 'Due',
      email: 'other-due@example.com',
      password: 'password123',
      username: null,
    })
    // Une task appartient toujours à une todolist.
    list = await ToDoList.create({ name: 'Liste due_date', userId: owner.id })
  })

  group.each.setup(async () => {
    await Task.query().delete()
    task = await Task.create({
      title: 'Tâche',
      status: 'todo',
      userId: owner.id,
      toDoListId: list.id,
    })
  })

  group.teardown(async () => {
    await Task.query().delete()
    await ToDoList.query().delete()
    await User.query().delete()
  })

  test('définit la due_date d’une task', async ({ client, assert }) => {
    const instant = '2026-07-15T10:30:00.000Z'
    const response = await client
      .put(`/api/tasks/${task.id}`)
      .loginAs(owner)
      .json({ due_date: instant })

    response.assertStatus(200)
    const updated = await Task.findOrFail(task.id)
    assert.isNotNull(updated.due_date)
    assert.equal(updated.due_date!.toMillis(), DateTime.fromISO(instant).toMillis())
  })

  test('conserve l’instant exact (round-trip UTC sur colonne timestamptz)', async ({
    client,
    assert,
  }) => {
    const instant = '2026-12-31T23:00:00.000Z'
    await client.put(`/api/tasks/${task.id}`).loginAs(owner).json({ due_date: instant })

    const updated = await Task.findOrFail(task.id)
    // L'instant stocké doit être rigoureusement identique à l'instant envoyé.
    assert.equal(updated.due_date!.toMillis(), DateTime.fromISO(instant).toMillis())
  })

  test('efface la due_date quand on envoie null', async ({ client, assert }) => {
    task.due_date = DateTime.fromISO('2026-07-15T10:30:00.000Z')
    await task.save()

    const response = await client
      .put(`/api/tasks/${task.id}`)
      .loginAs(owner)
      .json({ due_date: null })

    response.assertStatus(200)
    const updated = await Task.findOrFail(task.id)
    assert.isNull(updated.due_date)
  })

  test('ne touche pas à la due_date si elle est absente du payload', async ({ client, assert }) => {
    const instant = '2026-07-15T10:30:00.000Z'
    task.due_date = DateTime.fromISO(instant)
    await task.save()

    await client.put(`/api/tasks/${task.id}`).loginAs(owner).json({ title: 'Renommée' })

    const updated = await Task.findOrFail(task.id)
    assert.equal(updated.title, 'Renommée')
    assert.isNotNull(updated.due_date)
    assert.equal(updated.due_date!.toMillis(), DateTime.fromISO(instant).toMillis())
  })

  test('refuse une due_date d’un type invalide', async ({ client, assert }) => {
    const response = await client
      .put(`/api/tasks/${task.id}`)
      .loginAs(owner)
      .accept('json')
      .json({ due_date: 12345 })

    response.assertStatus(422)
    const updated = await Task.findOrFail(task.id)
    assert.isNull(updated.due_date)
  })

  test('un autre utilisateur ne peut pas modifier la due_date', async ({ client, assert }) => {
    const response = await client
      .put(`/api/tasks/${task.id}`)
      .loginAs(other)
      .accept('json')
      .json({ due_date: '2026-07-15T10:30:00.000Z' })

    response.assertStatus(404)
    const updated = await Task.findOrFail(task.id)
    assert.isNull(updated.due_date)
  })

  test('un accès non authentifié est refusé', async ({ client }) => {
    const response = await client
      .put(`/api/tasks/${task.id}`)
      .accept('json')
      .json({ due_date: '2026-07-15T10:30:00.000Z' })

    response.assertStatus(401)
  })

  test('met aussi à jour le statut (todo -> in_progress)', async ({ client, assert }) => {
    const response = await client
      .put(`/api/tasks/${task.id}`)
      .loginAs(owner)
      .json({ status: 'in_progress' })

    response.assertStatus(200)
    const updated = await Task.findOrFail(task.id)
    assert.equal(updated.status, 'in_progress')
  })
})
