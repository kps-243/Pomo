import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ToDoList from '#models/to_do_list'
import { createToDoListValidator, updateToDoListValidator } from '#validators/to_do_list'

export default class ToDoListsController {
  // Ne retourne que les todolists de l'utilisateur connecté
  index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return ToDoList.query().where('user_id', user.id)
  }

  async page({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const memberships = await db.from('group_members').where('user_id', user.id).select('group_id')
    const groupIds = memberships.map((m) => m.group_id)

    const toDoLists = await ToDoList.query()
      .where((query) => {
        query.where('user_id', user.id)
        if (groupIds.length) {
          query.orWhereIn('group_id', groupIds)
        }
      })
      .preload('group')
      .preload('tasks', (taskQuery) =>
        taskQuery.preload('members').preload('user').orderBy('position', 'asc').orderBy('id', 'asc')
      )
      .orderBy('created_at', 'asc')

    return inertia.render('ToDoLists', {
      toDoLists: toDoLists.map((list) => ({
        id: list.id,
        name: list.name,
        groupId: list.groupId,
        tasks: list.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          dueDate: task.due_date?.toISO() ?? null,
          timeSpent: task.timeSpent,
          createdBy: task.user
            ? { id: task.user.id, firstName: task.user.first_name, lastName: task.user.last_name }
            : null,
          members: task.members.map((member) => ({
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
          })),
        })),
      })),
    })
  }

  async storeFromBoard({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createToDoListValidator)
    await ToDoList.create({ ...payload, userId: user.id })
    return response.redirect().back()
  }

  async destroyFromBoard({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const toDoList = await ToDoList.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .withCount('tasks')
      .first()
    if (!toDoList) {
      return response.notFound({ message: 'ToDoList not found' })
    }

    if (Number(toDoList.$extras.tasks_count) > 0) {
      return response.redirect().back()
    }

    await toDoList.delete()
    return response.redirect().back()
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createToDoListValidator)
    try {
      const toDoList = await ToDoList.create({ ...payload, userId: user.id })
      return response.status(201).json({ message: 'ToDoList created successfully', toDoList })
    } catch (error) {
      return response.status(400).json({
        message: 'ToDoList creation failed',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async show({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const toDoList = await ToDoList.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      return toDoList
    } catch (error) {
      return response.status(404).json({
        message: 'ToDoList not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    // Renvoie err 422 et pas 404
    const payload = await request.validateUsing(updateToDoListValidator)
    try {
      const toDoList = await ToDoList.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      toDoList.merge(payload)
      await toDoList.save()
      return response.json({ message: 'ToDoList updated successfully', toDoList })
    } catch (error) {
      return response.status(404).json({
        message: 'ToDoList not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const toDoList = await ToDoList.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      await toDoList.delete()
      return response.json({ message: 'ToDoList deleted successfully' })
    } catch (error) {
      return response.status(404).json({
        message: 'ToDoList not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }
}
