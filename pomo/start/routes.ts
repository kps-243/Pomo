/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import UsersController from '#controllers/users_controller'
import TasksController from '#controllers/tasks_controller'
import HomeController from '#controllers/home_controller'

router.get('/', [HomeController, 'index'])

// User routes
router.get('api/users', [UsersController, 'index'])
router.post('register', [UsersController, 'register'])
router.get('api/users/:id', [UsersController, 'show'])
router.put('api/users/:id', [UsersController, 'update'])
router.delete('api/users/:id', [UsersController, 'destroy'])
router.post('login', [UsersController, 'login'])
router.post('logout', [UsersController, 'logout'])

// Task routes
router.get('api/tasks', [TasksController, 'index'])
router.post('api/tasks', [TasksController, 'store'])
router.get('api/tasks/:id', [TasksController, 'show'])
router.put('api/tasks/:id', [TasksController, 'update'])
router.delete('api/tasks/:id', [TasksController, 'destroy'])
