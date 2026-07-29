import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import Group from '#models/group'
import { createTaskValidator, reorderTasksValidator, updateTaskValidator } from '#validators/task'
import db from '@adonisjs/lucid/services/db'

export default class TasksController {
  /**
   * Place une nouvelle task en fin de liste. Sans ça elle prendrait la position 0
   * (valeur par défaut de la colonne) et s'afficherait en tête.
   */
  private async nextPosition(toDoListId: number) {
    const result = await db
      .from('tasks')
      .where('to_do_list_id', toDoListId)
      .max('position as max')
      .first()
    return result?.max === null || result?.max === undefined ? 0 : Number(result.max) + 1
  }

  /**
   * Retourne la todolist partagée du groupe
   */
  private async groupToDoList(groupId: number, userId: number) {
    const existing = await ToDoList.query().where('group_id', groupId).first()
    if (existing) return existing
    const group = await Group.findOrFail(groupId)
    return ToDoList.create({ name: group.name, userId, groupId })
  }

  /**
   * Ligne group_members si l'utilisateur appartient au groupe, sinon null.
   */
  private isGroupMember(groupId: number, userId: number) {
    return db.from('group_members').where('group_id', groupId).where('user_id', userId).first()
  }

  /**
   * Retourne la todolist si l'utilisateur peut y travailler depuis le board :
   * soit c'est la sienne, soit elle appartient à un groupe dont il est membre.
   */
  private async accessibleToDoList(todoListId: number | string, userId: number) {
    const toDoList = await ToDoList.query().where('id', todoListId).first()
    if (!toDoList) return null
    if (toDoList.userId === userId) return toDoList
    if (toDoList.groupId && (await this.isGroupMember(toDoList.groupId, userId))) return toDoList
    return null
  }

  /**
   * Retourne la task si l'utilisateur peut la gérer (CRUD) : soit c'est la sienne,
   * soit il est membre du groupe propriétaire de la todolist qui la contient.
   */
  private async manageableTask(taskId: number | string, userId: number) {
    const task = await Task.query().where('id', taskId).preload('toDoList').first()
    if (!task) return null
    if (task.userId === userId) return task
    const groupId = task.toDoList.groupId
    if (groupId && (await this.isGroupMember(groupId, userId))) return task
    return null
  }

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
      due_date: payload.due_date ? DateTime.fromISO(payload.due_date) : null,
      position: await this.nextPosition(toDoList.id),
      userId: user.id,
    })
    return response.status(201).json({ message: 'Task created successfully', task })
  }

  /**
   * Crée une tâche sur le calendrier partagé d'un groupe. Tout membre du
   * groupe peut ajouter une tâche.
   */
  async storeForGroup({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const isMember = await this.isGroupMember(Number(params.groupId), user.id)
    if (!isMember) {
      return response.notFound({ message: 'Group not found' })
    }

    const payload = await request.validateUsing(createTaskValidator)
    const toDoList = await this.groupToDoList(Number(params.groupId), user.id)
    await toDoList.related('tasks').create({
      ...payload,
      due_date: payload.due_date ? DateTime.fromISO(payload.due_date) : null,
      position: await this.nextPosition(toDoList.id),
      userId: user.id,
      groupId: Number(params.groupId),
    })
    return response.redirect().back()
  }

  /**
   * Modifie un évènement du calendrier partagé. Réservé à son créateur ou
   * au propriétaire du groupe.
   */
  async updateGroupTask({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await Task.query().where('id', params.id).where('group_id', params.groupId).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }

    const group = await Group.find(params.groupId)
    const canEdit = task.userId === user.id || group?.ownerId === user.id
    if (!canEdit) {
      return response.forbidden({ message: 'Not allowed' })
    }

    const { due_date: dueDate, ...payload } = await request.validateUsing(updateTaskValidator)
    task.merge(payload)
    if (dueDate !== undefined) {
      task.due_date = dueDate ? DateTime.fromISO(dueDate) : null
    }
    await task.save()
    return response.redirect().back()
  }

  /**
   * Supprime un évènement du calendrier partagé. Réservé à son créateur ou
   * au propriétaire du groupe.
   */
  async destroyGroupTask({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await Task.query().where('id', params.id).where('group_id', params.groupId).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }

    const group = await Group.find(params.groupId)
    const canDelete = task.userId === user.id || group?.ownerId === user.id
    if (!canDelete) {
      return response.forbidden({ message: 'Not allowed' })
    }

    await task.delete()
    return response.redirect().back()
  }

  async storeFromBoard({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)

    // Accessible si c'est ma liste ou celle d'un groupe dont je suis membre.
    const toDoList = await this.accessibleToDoList(params.todoListId, user.id)
    if (!toDoList) {
      return response.notFound({ message: 'ToDoList not found' })
    }

    await toDoList.related('tasks').create({
      ...payload,
      due_date: payload.due_date ? DateTime.fromISO(payload.due_date) : null,
      position: await this.nextPosition(toDoList.id),
      userId: user.id,
      groupId: toDoList.groupId,
    })
    return response.redirect().back()
  }

  async reorderFromBoard({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { taskIds } = await request.validateUsing(reorderTasksValidator)

    const toDoList = await this.accessibleToDoList(params.todoListId, user.id)
    if (!toDoList) {
      return response.notFound({ message: 'ToDoList not found' })
    }

    const tasksDeLaListe = await toDoList.related('tasks').query().select('id')
    const idsAttendus = tasksDeLaListe.map((task) => task.id)

    const idsRecus = new Set(taskIds)
    const memesIds =
      idsRecus.size === taskIds.length &&
      taskIds.length === idsAttendus.length &&
      idsAttendus.every((id) => idsRecus.has(id))
    if (!memesIds) {
      return response.unprocessableEntity({
        message: 'taskIds must contain exactly the tasks of this todolist',
      })
    }

    await db.transaction(async (trx) => {
      await Promise.all(
        taskIds.map((id, index) =>
          trx
            .from('tasks')
            .where('id', id)
            .where('to_do_list_id', toDoList.id)
            .update({ position: index })
        )
      )
    })

    return response.redirect().back()
  }

  async updateFromBoard({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { due_date: dueDate, ...payload } = await request.validateUsing(updateTaskValidator)

    const task = await this.manageableTask(params.id, user.id)
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }

    task.merge(payload)
    if (dueDate !== undefined) {
      task.due_date = dueDate ? DateTime.fromISO(dueDate) : null
    }
    await task.save()
    return response.redirect().back()
  }

  async destroyFromBoard({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await this.manageableTask(params.id, user.id)
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    await task.delete()
    return response.redirect().back()
  }

  /**
   * L'utilisateur connecté s'ajoute lui-même aux membres de la tâche.
   */
  async joinTask({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await this.manageableTask(params.id, user.id)
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    const already = await task.related('members').query().wherePivot('user_id', user.id).first()
    if (!already) {
      await task.related('members').attach([user.id])
    }
    return response.redirect().back()
  }

  /**
   * L'utilisateur connecté se retire des membres de la tâche.
   */
  async leaveTask({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await this.manageableTask(params.id, user.id)
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    await task.related('members').detach([user.id])
    return response.redirect().back()
  }

  async logPomodoro({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await this.manageableTask(params.id, user.id)
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    const minutes = Number(request.input('minutes'))
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return response.badRequest({ message: 'Invalid minutes' })
    }
    task.timeSpent += Math.round(minutes)
    await task.save()
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

    const toDoList = await ToDoList.query()
      .where('id', request.input('to_do_list_id') ?? 0)
      .where('user_id', user.id)
      .first()
    if (!toDoList) {
      return response.notFound({ message: 'ToDoList not found' })
    }

    const task = await toDoList.related('tasks').create({
      ...payload,
      due_date: payload.due_date ? DateTime.fromISO(payload.due_date) : null,
      position: await this.nextPosition(toDoList.id),
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
    const { due_date: dueDate, ...payload } = await request.validateUsing(updateTaskValidator)
    const task = await Task.query().where('id', params.id).where('user_id', user.id).first()
    if (!task) {
      return response.notFound({ message: 'Task not found' })
    }
    task.merge(payload)
    if (dueDate !== undefined) {
      task.due_date = dueDate ? DateTime.fromISO(dueDate) : null
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
