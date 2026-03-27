import Task from '#models/task'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia }: HttpContext) {
    const tasks = await Task.query().orderBy('created_at', 'desc').limit(5)
    return inertia.render('home', {
      tasks: tasks,
    })
  }
}
