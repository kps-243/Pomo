import { test } from '@japa/runner'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

const VALID_USER = {
  first_name: 'Alice',
  last_name: 'Dupont',
  username: null,
  email: 'alice@example.com',
  password: 'securepass123',
}

async function createUser(overrides: Partial<typeof VALID_USER> = {}) {
  return User.create({ ...VALID_USER, ...overrides })
}

async function cleanUsers() {
  await User.query().delete()
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
test.group('Register', (group) => {
  group.each.setup(() => cleanUsers())

  test('crée un compte valide et redirige vers /', async ({ client, assert }) => {
    const response = await client.post('/register').json(VALID_USER).redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/')

    const user = await User.findBy('email', VALID_USER.email)
    assert.isNotNull(user)
  })

  test('le mot de passe est haché en base', async ({ client, assert }) => {
    await client.post('/register').json(VALID_USER).redirects(0)

    const user = await User.findByOrFail('email', VALID_USER.email)
    assert.notEqual(user.password, VALID_USER.password)
    assert.isTrue(await hash.verify(user.password, VALID_USER.password))
  })

  test("échoue si l'email est déjà utilisé", async ({ client }) => {
    await createUser()
    const response = await client.post('/register').accept('json').json(VALID_USER)
    response.assertStatus(422)
  })

  test('échoue si le mot de passe fait moins de 8 caractères', async ({ client }) => {
    const response = await client
      .post('/register')
      .accept('json')
      .json({ ...VALID_USER, password: 'court' })
    response.assertStatus(422)
  })

  test("échoue si l'email est invalide", async ({ client }) => {
    const response = await client
      .post('/register')
      .accept('json')
      .json({ ...VALID_USER, email: 'pas-un-email' })
    response.assertStatus(422)
  })

  test('échoue si le prénom est manquant', async ({ client }) => {
    const { first_name: firstName, ...withoutFirstName } = VALID_USER
    const response = await client.post('/register').accept('json').json(withoutFirstName)
    response.assertStatus(422)
  })

  test('échoue si le nom de famille est manquant', async ({ client }) => {
    const { last_name: lastName, ...withoutLastName } = VALID_USER
    const response = await client.post('/register').accept('json').json(withoutLastName)
    response.assertStatus(422)
  })
})

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
test.group('Login', (group) => {
  group.each.setup(async () => {
    await cleanUsers()
    await createUser()
  })

  test('connecte un utilisateur valide et redirige vers /', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: VALID_USER.email, password: VALID_USER.password })
      .redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/')
  })

  test('échoue avec un mauvais mot de passe', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: VALID_USER.email, password: 'mauvais_mdp' })
      .redirects(0)
    response.assertStatus(400)
  })

  test('échoue avec un email inconnu', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: 'inconnu@example.com', password: VALID_USER.password })
      .redirects(0)
    response.assertStatus(400)
  })

  test('échoue si le mot de passe fait moins de 8 caractères', async ({ client }) => {
    const response = await client
      .post('/login')
      .json({ email: VALID_USER.email, password: 'court' })
      .redirects(0)
    response.assertStatus(400)
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
test.group('Logout', (group) => {
  group.each.setup(() => cleanUsers())

  test("déconnecte l'utilisateur et redirige vers /login", async ({ client }) => {
    const user = await createUser()
    const response = await client.post('/logout').loginAs(user).redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/login')
  })
})
