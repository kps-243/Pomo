import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Task from '#models/task'
import User from '#models/user'

test.group('Tasks CRUD', (group) => {
  let user: User

  group.setup(async () => {
    await Task.query().delete()
    await User.query().delete()
    user = await User.create({
      first_name: 'Test',
      last_name: 'User',
      email: 'test-tasks@example.com',
      password: 'password123',
      username: null,
    })
    await Task.create({
      title: 'Seed Task',
      description: 'Task created for tests',
      status: 'todo',
      userId: user.id,
      duration: 25,
      start_date: DateTime.now(),
    })
  })

  group.teardown(async () => {
    await Task.query().delete()
    await User.query().delete()
  })

  test('refuse un accès non authentifié', async ({ client }) => {
    const response = await client.get('/api/tasks').redirects(0)
    response.assertStatus(302) // middleware auth -> redirige vers /login
  })

  test('can create a task', async ({ client }) => {
    const response = await client.post('/api/tasks').loginAs(user).json({
      title: 'Test Task',
      description: 'This is a test task',
      status: 'todo',
      duration: 25,
      start_date: new Date().toISOString(),
    })

    response.assertStatus(201)
  })

  test('get a list of tasks', async ({ client }) => {
    const response = await client.get('/api/tasks').loginAs(user)
    response.assertStatus(200)
  })

  test('can update a task', async ({ client }) => {
    const task = await Task.firstOrFail()
    const response = await client.put(`/api/tasks/${task.id}`).loginAs(user).json({
      title: 'Updated Test Task',
      description: 'This is an updated test task',
      status: 'done',
      duration: 30,
      start_date: new Date().toISOString(),
    })

    response.assertStatus(200)
  })

  test('can delete a task', async ({ client }) => {
    const task = await Task.firstOrFail()
    const response = await client.delete(`/api/tasks/${task.id}`).loginAs(user)

    response.assertStatus(200)
  })
})
