import Task from '#models/task'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const tasks = await Task.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(10)

    return inertia.render('home', {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        dueDate: task.due_date?.toISO() ?? null,
        duration: task.duration ?? 0,
      })),
    })
  }
}
