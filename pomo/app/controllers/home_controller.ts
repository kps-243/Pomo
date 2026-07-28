import Task from '#models/task'
import ToDoList from '#models/to_do_list'
import Event from '#models/event'
import Group from '#models/group'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const memberships = await db.from('group_members').where('user_id', user.id).select('group_id')
    const groupIds = memberships.map((membership) => membership.group_id as number)

    const tasks = await Task.query()
      .where((query) => {
        query.where('user_id', user.id)
        if (groupIds.length) query.orWhereIn('group_id', groupIds)
      })
      .preload('user')
      .preload('members')
      .preload('toDoList')
      .orderBy('due_date', 'asc')

    const events = await Event.query()
      .where((query) => {
        query.where((personal) => personal.where('user_id', user.id).whereNull('group_id'))
        if (groupIds.length) query.orWhereIn('group_id', groupIds)
      })
      .preload('user')
      .orderBy('start_date', 'asc')

    const toDoLists = await ToDoList.query()
      .where('user_id', user.id)
      .whereNull('group_id')
      .orderBy('created_at', 'asc')

    const groups = groupIds.length
      ? await Group.query().whereIn('id', groupIds).orderBy('name', 'asc')
      : []
    const groupNameById = new Map(groups.map((group) => [group.id, group.name]))

    const calendarToken = await user.ensureCalendarToken()

    return inertia.render('home', {
      currentUserId: user.id,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.due_date?.toISO() ?? null,
        timeSpent: task.timeSpent,
        listId: task.toDoListId,
        listName: task.toDoList.name,
        groupId: task.groupId,
        groupName: task.groupId ? (groupNameById.get(task.groupId) ?? null) : null,
        createdBy: task.user
          ? {
              id: task.user.id,
              firstName: task.user.first_name,
              lastName: task.user.last_name,
              avatarUrl: task.user.avatar ?? null,
            }
          : null,
        members: task.members.map((member) => ({
          id: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          avatarUrl: member.avatar ?? null,
        })),
      })),
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.start_date.toISO(),
        endDate: event.end_date?.toISO() ?? null,
        location: event.location,
        groupId: event.groupId,
        groupName: event.groupId ? (groupNameById.get(event.groupId) ?? null) : null,
        createdBy: event.user
          ? {
              id: event.user.id,
              firstName: event.user.first_name,
              lastName: event.user.last_name,
              avatarUrl: event.user.avatar ?? null,
            }
          : null,
      })),
      toDoLists: toDoLists.map((list) => ({ id: list.id, name: list.name })),
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        isOwner: group.ownerId === user.id,
      })),
      calendarFeedUrl: `${env.get('APP_URL')}/calendar/${calendarToken}/feed.ics`,
    })
  }
}
