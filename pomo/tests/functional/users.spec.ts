import { test } from '@japa/runner';
import User from '#models/user';

test.group('Users CRUD', () => {

  test('can create a user', async ({ client }) => {
    const response = await client.post('/register').json({
      last_name: 'User',
      first_name: 'Test',
      email: 'test@mail.com',
      password: 'password123',
      username: 'Test User'
    })

    response.assertStatus(201)
  })

  test('can login a user', async ({ client }) => {
    const response = await client.post('/login').json({
      email: 'test@mail.com',
      password: 'password123'
    })
    response.assertStatus(201)
  })

  test('get a paginated list of users', async ({ client }) => {
    const response = await client.get('/api/users')

    response.assertStatus(200)
  })

  test('can update a user', async ({ client }) => {
    const user = await User.findByOrFail('email', 'test@mail.com')
    const response = await client.put(`/api/users/${user.id}`).json({
      first_name: "OK",
      last_name: "Dac",
      username: "kokoji",
      password: 'newpassword123'
    })

    response.assertStatus(200)
  })

  test('can logout a user', async ({ client }) => {
    const response = await client.post('/logout')

    response.assertStatus(200)
  })

  test('can delete a user', async ({ client }) => {
    const user = await User.findByOrFail('email', 'test@mail.com')
    const response = await client.delete(`/api/users/${user.id}`)

    response.assertStatus(200)
  })
})