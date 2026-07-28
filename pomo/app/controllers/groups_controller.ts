import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import Group from '#models/group'
import ToDoList from '#models/to_do_list'
import User from '#models/user'
import Event from '#models/event'
import GroupInvitationMail from '#mails/group_invitation_mail'
import { createOrRefreshInvitation } from '#services/group_invitation_service'
import { issueChatTicket } from '#services/chat_ticket'
import { listMessages } from '#services/group_chat_service'
import { WS_PATH } from '#services/ws'
import {
  createGroupValidator,
  updateGroupValidator,
  inviteMemberValidator,
} from '#validators/group'

export default class GroupsController {
  /**
   * Renvoie la ligne de group_members si l'utilisateur appartient au groupe, sinon null.
   */
  private isMember(groupId: number | string, userId: number) {
    return db.from('group_members').where('group_id', groupId).where('user_id', userId).first()
  }

  async page({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const memberships = await db
      .from('group_members')
      .where('user_id', user.id)
      .select('group_id', 'role')

    const groupIds = memberships.map((m) => m.group_id)
    const roleByGroupId = new Map(memberships.map((m) => [m.group_id, m.role]))

    const groups = groupIds.length
      ? await Group.query()
          .whereIn('id', groupIds)
          .withCount('members')
          .orderBy('created_at', 'asc')
      : []

    return inertia.render('Groups/Index', {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        role: roleByGroupId.get(group.id) ?? 'member',
        membersCount: Number(group.$extras.members_count),
      })),
    })
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createGroupValidator)
    const group = await Group.create({ ...payload, ownerId: user.id })
    await group.related('members').attach({ [user.id]: { role: 'owner' } })
    // Chaque groupe possède une todolist partagée, qui porte le nom du groupe.
    await ToDoList.create({ name: group.name, userId: user.id, groupId: group.id })
    return response.redirect().back()
  }

  async show({ params, auth, inertia, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const membership = await this.isMember(params.id, user.id)
    if (!membership) {
      return response.notFound({ message: 'Group not found' })
    }

    const group = await Group.query()
      .where('id', params.id)
      .preload('members', (membersQuery) => membersQuery.pivotColumns(['role']))
      .preload('tasks', (tasksQuery) =>
        tasksQuery.preload('user').preload('members').orderBy('due_date', 'asc')
      )
      .firstOrFail()

    const events = await Event.query()
      .where('group_id', group.id)
      .preload('user')
      .orderBy('start_date', 'asc')

    const calendarToken = await user.ensureCalendarToken()
    const messages = await listMessages(group.id)

    return inertia.render('Groups/Show', {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
      },
      currentUserId: user.id,
      calendarFeedUrl: `${env.get('APP_URL')}/calendar/${calendarToken}/feed.ics`,
      chat: {
        token: issueChatTicket({ userId: user.id, groupId: group.id }),
        path: WS_PATH,
        messages,
      },
      members: group.members.map((member) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        role: member.$extras.pivot_role,
      })),
      tasks: group.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.due_date?.toISO() ?? null,
        timeSpent: task.timeSpent,
        listId: task.toDoListId,
        listName: group.name,
        groupId: group.id,
        groupName: group.name,
        createdBy: task.user
          ? { id: task.user.id, firstName: task.user.first_name, lastName: task.user.last_name }
          : null,
        members: task.members.map((member) => ({
          id: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
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
        groupName: group.name,
        createdBy: event.user
          ? { id: event.user.id, firstName: event.user.first_name, lastName: event.user.last_name }
          : null,
      })),
    })
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const group = await Group.query().where('id', params.id).where('owner_id', user.id).first()
    if (!group) {
      return response.notFound({ message: 'Group not found' })
    }
    const payload = await request.validateUsing(updateGroupValidator)
    group.merge(payload)
    await group.save()
    if (payload.name) {
      await ToDoList.query().where('group_id', group.id).update({ name: group.name })
    }
    return response.redirect().back()
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const group = await Group.query().where('id', params.id).where('owner_id', user.id).first()
    if (!group) {
      return response.notFound({ message: 'Group not found' })
    }
    await group.delete()
    return response.redirect('/groups')
  }

  async inviteMember({ params, request, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const group = await Group.query().where('id', params.id).where('owner_id', user.id).first()
    if (!group) {
      return response.notFound({ message: 'Group not found' })
    }

    const { email } = await request.validateUsing(inviteMemberValidator)

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      const alreadyMember = await this.isMember(group.id, existingUser.id)
      if (alreadyMember) {
        session.flashErrors({ email: 'Cet utilisateur est déjà membre du groupe' })
        return response.redirect().back()
      }
    }

    const { invitation, token } = await createOrRefreshInvitation({
      group,
      email,
      invitedBy: user,
    })

    await mail.send(
      new GroupInvitationMail(
        invitation,
        token,
        group.name,
        `${user.first_name} ${user.last_name}`.trim()
      )
    )

    session.flash('success', 'Invitation envoyée.')
    return response.redirect().back()
  }

  async removeMember({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const group = await Group.query().where('id', params.id).where('owner_id', user.id).first()
    if (!group) {
      return response.notFound({ message: 'Group not found' })
    }

    // Le propriétaire ne peut pas se retirer lui-même : il doit supprimer le groupe.
    if (Number(params.userId) === group.ownerId) {
      return response.redirect().back()
    }

    await group.related('members').detach([Number(params.userId)])
    return response.redirect().back()
  }

  async leave({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const group = await Group.findOrFail(params.id)

    // Le propriétaire doit supprimer le groupe plutôt que le quitter.
    if (group.ownerId === user.id) {
      return response.redirect().back()
    }

    await group.related('members').detach([user.id])
    return response.redirect('/groups')
  }
}
