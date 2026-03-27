import { test } from '@japa/runner'
import Task from '#models/task'
import User from '#models/user'

test.group('Tasks CRUD', () => {
  test('can create a task', async ({ client }) => {
    const response = await client.post('/api/tasks').json({
      title: 'Test Task',
      description: 'This is a test task',
      status: 'todo',
      user_id: 2,
      duration: 25,
      start_date: new Date().toISOString(),
    })
    response.assertStatus(201)
  })

  test('get a paginated list of tasks', async ({ client }) => {
    const response = await client.get('/api/tasks')
    response.assertStatus(200)
  })

  test('can update a task', async ({ client }) => {
    const task = await Task.firstOrFail()
    const response = await client.put(`/api/tasks/${task.id}`).json({
      title: 'Updated Test Task',
      description: 'This is an updated test task',
      status: 'done',
      user_id: 2,
      duration: 30,
      start_date: new Date().toISOString(),
    })

    response.assertStatus(200)
  })

  test('can delete a task', async ({ client }) => {
    const task = await Task.firstOrFail()
    const response = await client.delete(`/api/tasks/${task.id}`)

    response.assertStatus(200)
  })
})
