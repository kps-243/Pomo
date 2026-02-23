/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const UsersController = () => import('#controllers/users_controller')

router.on('/').renderInertia('home')
router.get('users', [UsersController, 'index'])
router.post('register', [UsersController, 'register'])
router.put('users/:id', [UsersController, 'update'])
router.delete('users/:id', [UsersController, 'destroy'])
router.post('login', [UsersController, 'login'])
router.post('logout', [UsersController, 'logout'])
