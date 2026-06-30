import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import { createTaskValidator, updateTaskValidator } from '#validators/task'

export default class TasksController {
  /**
   * Liste les tasks d'une todolist, seulement si elle appartient
   * à l'utilisateur connecté (sinon 404).
   */
  async indexForToDoList({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const toDoList = await ToDoList.query()
      .where('id', params.todoListId)
      .where('user_id', user.id)
      .first()
    if (!toDoList) {
      return response.status(404).json({ message: 'ToDoList not found' })
    }
    return toDoList.related('tasks').query()
  }

  /**
   * Ajoute une task dans une todolist, seulement si elle appartient
   * à l'utilisateur connecté (sinon 404).
   */
  async storeForToDoList({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)

    const toDoList = await ToDoList.query()
      .where('id', params.todoListId)
      .where('user_id', user.id)
      .first()
    if (!toDoList) {
      return response.status(404).json({ message: 'ToDoList not found' })
    }

    const task = await toDoList.related('tasks').create({
      ...payload,
      start_date: payload.start_date ? DateTime.fromISO(payload.start_date) : null,
      userId: user.id,
    })
    return response.status(201).json({ message: 'Task created successfully', task })
  }

  async storeFromBoard({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)

    const toDoList = await ToDoList.query()
      .where('id', params.todoListId)
      .where('user_id', user.id)
      .first()
    if (!toDoList) {
      return response.notFound({ message: 'ToDoList not found' })
    }

    await toDoList.related('tasks').create({
      ...payload,
      start_date: payload.start_date ? DateTime.fromISO(payload.start_date) : null,
      userId: user.id,
    })
    return response.redirect().back()
  }

  async updateFromBoard({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { start_date: startDate, ...payload } = await request.validateUsing(updateTaskValidator)

    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }

    task.merge(payload)
    if (startDate !== undefined) {
      task.start_date = startDate ? DateTime.fromISO(startDate) : null
    }
    await task.save()
    return response.redirect().back()
  }

  async destroyFromBoard({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    await task.delete()
    return response.redirect().back()
  }

  // CRUD générique des tasks de l'utilisateur connecté (toutes scopées à user.id)
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Task.query().where('user_id', user.id)
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)
    const task = await Task.create({
      ...payload,
      start_date: payload.start_date ? DateTime.fromISO(payload.start_date) : null,
      userId: user.id,
    })
    return response.status(201).json({ message: 'Task created successfully', task })
  }

  async show({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    return task
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { start_date: startDate, ...payload } = await request.validateUsing(updateTaskValidator)
    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    task.merge(payload)
    if (startDate !== undefined) {
      task.start_date = startDate ? DateTime.fromISO(startDate) : null
    }
    await task.save()
    return response.json({ message: 'Task updated successfully', task })
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    await task.delete()
    return response.json({ message: 'Task deleted successfully' })
  }
}
