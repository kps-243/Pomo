import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Task from '#models/task'
import { buildIcsCalendar } from '#services/ics_builder'

export default class CalendarFeedController {
  /**
   * Flux iCal public (sans authentification par session — les
   * applications de calendrier s'y abonnent directement par URL).
   */
  async feed({ params, response }: HttpContext) {
    const user = await User.findBy('calendar_token', params.token)
    if (!user) {
      return response.notFound('Calendar feed not found')
    }

    const memberships = await db.from('group_members').where('user_id', user.id).select('group_id')
    const groupIds = memberships.map((m) => m.group_id)

    const tasks = await Task.query()
      .where((query) => {
        query.where('user_id', user.id)
        if (groupIds.length) {
          query.orWhereIn('group_id', groupIds)
        }
      })
      .whereNotNull('due_date')

    const events = tasks.map((task) => ({
      uid: `task-${task.id}`,
      title: task.title,
      description: task.description,
      start: task.due_date!,
      end: task.due_date!.plus({ minutes: task.duration ?? 30 }),
    }))

    const ics = buildIcsCalendar('Pomo', events)

    response.header('Content-Type', 'text/calendar; charset=utf-8')
    response.header('Content-Disposition', 'inline; filename="pomo.ics"')
    return response.send(ics)
  }

  /**
   * Régénère le token du flux calendrier de l'utilisateur, invalidant
   * l'ancien lien d'abonnement.
   */
  async regenerate({ auth, response }: HttpContext) {
    const authUser = auth.getUserOrFail()
    const user = await User.findOrFail(authUser.id)
    user.calendarToken = randomBytes(32).toString('hex')
    await user.save()
    return response.redirect().back()
  }
}
