/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const UsersController = () => import('#controllers/users_controller')
const TasksController = () => import('#controllers/tasks_controller')
const HomeController = () => import('#controllers/home_controller')
const ToDoListsController = () => import('#controllers/to_do_lists_controller')

router.get('/', [HomeController, 'index']).use(middleware.auth())

router.get('/todolists', [ToDoListsController, 'page']).use(middleware.auth())

// User routes
router.get('api/users', [UsersController, 'index'])
router.get('register', [UsersController, 'create'])
router.post('register', [UsersController, 'store'])
router.get('api/users/:id', [UsersController, 'show'])
router.put('api/users/:id', [UsersController, 'update'])
router.delete('api/users/:id', [UsersController, 'destroy'])
router.get('login', [UsersController, 'connection'])
router.post('login', [UsersController, 'login'])
router.post('logout', [UsersController, 'logout'])

// Task routes
router.get('api/tasks', [TasksController, 'index'])
router.post('api/tasks', [TasksController, 'store'])
router.get('api/tasks/:id', [TasksController, 'show'])
router.put('api/tasks/:id', [TasksController, 'update'])
router.delete('api/tasks/:id', [TasksController, 'destroy'])

// ToDoList routes
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
