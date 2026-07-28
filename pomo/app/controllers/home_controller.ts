import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const tasks = await Task.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(10)

    const toDoLists = await ToDoList.query()
      .where('user_id', user.id)
      .whereNull('group_id')
      .orderBy('created_at', 'asc')

    const calendarToken = await user.ensureCalendarToken()

    return inertia.render('home', {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        dueDate: task.due_date?.toISO() ?? null,
        duration: task.duration ?? 0,
      })),
      toDoLists: toDoLists.map((list) => ({ id: list.id, name: list.name })),
      calendarFeedUrl: `${env.get('APP_URL')}/calendar/${calendarToken}/feed.ics`,
    })
  }
}
