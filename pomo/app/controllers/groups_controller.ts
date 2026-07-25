import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import Group from '#models/group'
import User from '#models/user'
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
      .preload('tasks', (tasksQuery) => tasksQuery.preload('user').orderBy('due_date', 'asc'))
      .firstOrFail()

    const calendarToken = await user.ensureCalendarToken()

    return inertia.render('Groups/Show', {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
      },
      currentUserId: user.id,
      calendarFeedUrl: `${env.get('APP_URL')}/calendar/${calendarToken}/feed.ics`,
      members: group.members.map((member) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        role: member.$extras.pivot_role,
      })),
      events: group.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date?.toISO() ?? null,
        duration: task.duration ?? 0,
        createdBy: task.user
          ? { id: task.user.id, firstName: task.user.first_name, lastName: task.user.last_name }
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
    const invitee = await User.findBy('email', email)
    if (!invitee) {
      session.flashErrors({ email: "Aucun utilisateur n'est inscrit avec cet email" })
      return response.redirect().back()
    }

    const alreadyMember = await this.isMember(group.id, invitee.id)
    if (alreadyMember) {
      session.flashErrors({ email: 'Cet utilisateur est déjà membre du groupe' })
      return response.redirect().back()
    }

    await group.related('members').attach({ [invitee.id]: { role: 'member' } })
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
