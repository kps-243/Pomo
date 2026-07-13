import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { registerValidator, loginValidator, updateUserValidator } from '#validators/auth'

export default class UsersController {
  index() {
    return User.all()
  }

  create({ inertia }: HttpContext) {
    return inertia.render('Auth/Register')
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await User.create(payload)
    await auth.use('web').login(user)
    return response.redirect('/')
  }

  connection({ inertia }: HttpContext) {
    return inertia.render('Auth/Login')
  }

  async login({ request, response, auth }: HttpContext) {
    const data = request.only(['email', 'password'])
    try {
      const validatedData = await request.validateUsing(loginValidator, { data })
      const user = await User.verifyCredentials(validatedData.email, validatedData.password)

      await auth.use('web').login(user)

      return response.redirect('/')
    } catch (error) {
      return response.status(400).json({ message: 'Login failed', error: error.message })
    }
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }

  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)
      return user
    } catch (error) {
      return response.status(404).json({ message: 'User not found', error: error.message })
    }
  }

  async update({ request, response, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = request.all()
    try {
      const validatedData = await request.validateUsing(updateUserValidator, data)
      user.merge(validatedData)
      await user.save()
      return response.json({ message: 'User updated successfully', user })
    } catch (error) {
      return response.status(400).json({ message: 'Update failed', error: error.message })
    }
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    try {
      await user.delete()
      return response.json({ message: 'User deleted successfully' })
    } catch (error) {
      return response.status(400).json({ message: 'Deletion failed', error: error.message })
    }
  }
}
