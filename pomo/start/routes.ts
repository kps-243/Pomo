/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import User from '#models/user'
import { middleware } from '#start/kernel'
import { healthChecks } from '#start/health'
const UsersController = () => import('#controllers/users_controller')
const TasksController = () => import('#controllers/tasks_controller')
const HomeController = () => import('#controllers/home_controller')
const ToDoListsController = () => import('#controllers/to_do_lists_controller')
const TwoFactorController = () => import('#controllers/two_factor_controller')

// Healthcheck Docker
router.get('/health', async ({ response }) => {
  const report = await healthChecks.run()
  return report.isHealthy ? response.ok(report) : response.serviceUnavailable(report)
})

/*
|--------------------------------------------------------------------------
| OAuth (Ally) — GitHub & Google
|--------------------------------------------------------------------------
*/

// GitHub
router.get('/github/redirect', ({ ally, session }) => {
  session.put('redirect.previousUrl', '/login')
  return ally.use('github').redirect()
})

router.get('/github/callback', async ({ ally, auth, response }) => {
  const github = ally.use('github')

  if (github.accessDenied()) {
    return response.redirect('/login')
  }
  if (github.stateMisMatch() || github.hasError()) {
    return response.redirect('/login')
  }

  const githubUser = await github.user()
  const [firstName = '', lastName = ''] = (githubUser.name ?? '').split(' ')

  const user = await User.firstOrCreate(
    { email: githubUser.email },
    {
      username: githubUser.nickName,
      email: githubUser.email,
      password: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
    }
  )

  await auth.use('web').login(user)
  return response.redirect('/')
})

// Google
router.get('/google/redirect', ({ ally, session }) => {
  session.put('redirect.previousUrl', '/login')
  return ally.use('google').redirect()
})

router.get('/google/callback', async ({ ally, auth, response }) => {
  const google = ally.use('google')

  if (google.accessDenied()) {
    return response.redirect('/login')
  }
  if (google.stateMisMatch() || google.hasError()) {
    return response.redirect('/login')
  }

  const googleUser = await google.user()
  const [firstName = '', lastName = ''] = (googleUser.name ?? '').split(' ')

  const user = await User.firstOrCreate(
    { email: googleUser.email },
    {
      username: googleUser.nickName,
      email: googleUser.email,
      password: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
    }
  )

  await auth.use('web').login(user)
  return response.redirect('/')
})

/*
|--------------------------------------------------------------------------
| Pages Inertia (réservées à l'utilisateur connecté)
|--------------------------------------------------------------------------
*/
router.get('/', [HomeController, 'index']).use(middleware.auth())
router.get('/todolists', [ToDoListsController, 'page']).use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Actions "home/board" (formulaires Inertia -> redirect back)
| Toutes réservées à l'utilisateur connecté
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    /*router.post('/tasks', [TasksController, 'storeFromHome'])*/
    router.post('/todolists', [ToDoListsController, 'storeFromBoard'])
    router.delete('/todolists/:id', [ToDoListsController, 'destroyFromBoard'])
    router.post('/todolists/:todoListId/tasks', [TasksController, 'storeFromBoard'])
    router.put('/todolists/:todoListId/tasks/reorder', [TasksController, 'reorderFromBoard'])
    router.put('/tasks/:id', [TasksController, 'updateFromBoard'])
    router.delete('/tasks/:id', [TasksController, 'destroyFromBoard'])
  })
  .use(middleware.auth())

/*
|--------------------------------------------------------------------------
| Auth & comptes (publiques)
|--------------------------------------------------------------------------
*/
router.get('register', [UsersController, 'create'])
router.post('register', [UsersController, 'store'])
router.get('login', [UsersController, 'connection'])
router.post('login', [UsersController, 'login'])
router.post('logout', [UsersController, 'logout'])

// 2FA — login flow (public, session pending)
router.get('/two-factor/verify', [TwoFactorController, 'showVerify'])
router.post('/two-factor/verify', [TwoFactorController, 'verify'])

// 2FA — gestion (authentifié)
router.get('/two-factor/setup', [TwoFactorController, 'showSetup']).use(middleware.auth())
router.post('/two-factor/enable', [TwoFactorController, 'enable']).use(middleware.auth())
router.post('/two-factor/disable', [TwoFactorController, 'disable']).use(middleware.auth())

// Paramètres sécurité
router.get('/settings/security', [TwoFactorController, 'securityPage']).use(middleware.auth())

// ⚠️ À sécuriser plus tard : ce CRUD users est encore public
router.get('api/users', [UsersController, 'index'])
router.get('api/users/:id', [UsersController, 'show'])
router.put('api/users/:id', [UsersController, 'update'])
router.delete('api/users/:id', [UsersController, 'destroy'])

/*
|--------------------------------------------------------------------------
| API Tasks (CRUD générique, scopé à l'utilisateur connecté)
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('api/tasks', [TasksController, 'index'])
    router.post('api/tasks', [TasksController, 'store'])
    router.get('api/tasks/:id', [TasksController, 'show'])
    router.put('api/tasks/:id', [TasksController, 'update'])
    router.delete('api/tasks/:id', [TasksController, 'destroy'])
  })
  .use(middleware.auth())

/*
|--------------------------------------------------------------------------
| API ToDoLists (scopées au propriétaire) + tasks d'une liste
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('todolists', [ToDoListsController, 'index'])
    router.post('todolists', [ToDoListsController, 'store'])
    router.get('todolists/:id', [ToDoListsController, 'show'])
    router.put('todolists/:id', [ToDoListsController, 'update'])
    router.delete('todolists/:id', [ToDoListsController, 'destroy'])

    // Tasks d'une todolist (accès réservé au propriétaire de la liste)
    router.get('todolists/:todoListId/tasks', [TasksController, 'indexForToDoList'])
    router.post('todolists/:todoListId/tasks', [TasksController, 'storeForToDoList'])
  })
  .prefix('api')
  .use(middleware.auth())
