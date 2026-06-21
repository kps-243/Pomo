import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import { createTaskValidator } from '#validators/task'

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

  index() {
    return Task.all()
  }

  async store({ request, response }: HttpContext) {
    const data = request.all()
    try {
      const task = await Task.create(data)
      return response.status(201).json({ message: 'Task created successfully', task })
    } catch (error) {
      return response.status(400).json({ message: 'Task creation failed', error: error.message })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const task = await Task.findOrFail(params.id)
      return task
    } catch (error) {
      return response.status(404).json({ message: 'Task not found', error: error.message })
    }
  }

  async update({ params, request, response }: HttpContext) {
    try {
      const task = await Task.findOrFail(params.id)
      const data = request.all()
      task.merge(data)
      await task.save()
      return response.json({ message: 'Task updated successfully', task })
    } catch (error) {
      return response.status(400).json({ message: 'Task update failed', error: error.message })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const task = await Task.findOrFail(params.id)
      await task.delete()
      return response.json({ message: 'Task deleted successfully' })
    } catch (error) {
      return response.status(404).json({ message: 'Task not found', error: error.message })
    }
  }
}
