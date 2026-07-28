import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Event from '#models/event'
import Group from '#models/group'
import {
  createBoardEventValidator,
  createEventValidator,
  updateBoardEventValidator,
  updateEventValidator,
} from '#validators/event'

export default class EventsController {
  /**
   * Ligne group_members si l'utilisateur appartient au groupe, sinon null.
   */
  private isGroupMember(groupId: number | string, userId: number) {
    return db.from('group_members').where('group_id', groupId).where('user_id', userId).first()
  }

  /**
   * Retourne l'évènement si l'utilisateur peut le modifier/supprimer : soit il
   * l'a créé, soit il est propriétaire du groupe auquel il appartient.
   */
  private async manageableEvent(eventId: number | string, userId: number) {
    const event = await Event.find(eventId)
    if (!event) return null
    if (event.userId === userId) return event
    if (!event.groupId) return null
    const group = await Group.find(event.groupId)
    return group?.ownerId === userId ? event : null
  }

  // Ne retourne que les events de l'utilisateur connecté
  index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return Event.query().where('user_id', user.id).orderBy('start_date', 'asc')
  }

  async store({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const {
      start_date: startDate,
      end_date: endDate,
      ...payload
    } = await request.validateUsing(createEventValidator)
    const event = await Event.create({
      ...payload,
      start_date: DateTime.fromISO(startDate),
      end_date: endDate ? DateTime.fromISO(endDate) : null,
      userId: user.id,
    })
    return response.status(201).json({ message: 'Event created successfully', event })
  }

  async show({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const event = await Event.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      return event
    } catch (error) {
      return response.status(404).json({
        message: 'Event not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const {
      start_date: startDate,
      end_date: endDate,
      ...payload
    } = await request.validateUsing(updateEventValidator)
    try {
      const event = await Event.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      event.merge(payload)
      if (startDate !== undefined) {
        event.start_date = DateTime.fromISO(startDate)
      }
      if (endDate !== undefined) {
        event.end_date = endDate ? DateTime.fromISO(endDate) : null
      }
      await event.save()
      return response.json({ message: 'Event updated successfully', event })
    } catch (error) {
      return response.status(404).json({
        message: 'Event not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const event = await Event.query()
        .where('id', params.id)
        .where('user_id', user.id)
        .firstOrFail()
      await event.delete()
      return response.json({ message: 'Event deleted successfully' })
    } catch (error) {
      return response.status(404).json({
        message: 'Event not found',
        error: error instanceof Error ? error.message : error,
      })
    }
  }

  /**
   * Création d'un évènement dans le calendrier personnel, depuis le calendrier.
   */
  async storeFromBoard({ request, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createBoardEventValidator)
    const dates = this.parseDates(payload.start_date, payload.end_date)
    if (!dates) {
      session.flashErrors({ end_date: 'La fin doit être postérieure au début' })
      return response.redirect().back()
    }

    await Event.create({
      title: payload.title,
      description: payload.description ?? null,
      location: payload.location ?? null,
      start_date: dates.start,
      end_date: dates.end,
      userId: user.id,
      groupId: null,
    })
    return response.redirect().back()
  }

  /**
   * Création d'un évènement dans le calendrier partagé d'un groupe.
   * Tout membre du groupe peut en ajouter un.
   */
  async storeForGroup({ params, request, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const isMember = await this.isGroupMember(params.groupId, user.id)
    if (!isMember) {
      return response.notFound({ message: 'Group not found' })
    }

    const payload = await request.validateUsing(createBoardEventValidator)
    const dates = this.parseDates(payload.start_date, payload.end_date)
    if (!dates) {
      session.flashErrors({ end_date: 'La fin doit être postérieure au début' })
      return response.redirect().back()
    }

    await Event.create({
      title: payload.title,
      description: payload.description ?? null,
      location: payload.location ?? null,
      start_date: dates.start,
      end_date: dates.end,
      userId: user.id,
      groupId: Number(params.groupId),
    })
    return response.redirect().back()
  }

  /**
   * Modification depuis le calendrier. Réservée au créateur de l'évènement ou,
   * pour un évènement de groupe, au propriétaire du groupe.
   */
  async updateFromBoard({ params, request, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const event = await this.manageableEvent(params.id, user.id)
    if (!event) {
      return response.notFound({ message: 'Event not found' })
    }

    const {
      start_date: startDate,
      end_date: endDate,
      ...payload
    } = await request.validateUsing(updateBoardEventValidator)

    const dates = this.parseDates(
      startDate ?? event.start_date.toISO()!,
      endDate ?? event.end_date?.toISO() ?? event.start_date.plus({ hours: 1 }).toISO()!
    )
    if (!dates) {
      session.flashErrors({ end_date: 'La fin doit être postérieure au début' })
      return response.redirect().back()
    }

    event.merge(payload)
    event.start_date = dates.start
    event.end_date = dates.end
    await event.save()
    return response.redirect().back()
  }

  /**
   * Suppression depuis le calendrier. Mêmes droits que la modification.
   */
  async destroyFromBoard({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const event = await this.manageableEvent(params.id, user.id)
    if (!event) {
      return response.notFound({ message: 'Event not found' })
    }
    await event.delete()
    return response.redirect().back()
  }

  /**
   * Convertit le couple de dates ISO en DateTime, ou null si l'intervalle est
   * invalide (fin avant ou égale au début).
   */
  private parseDates(startIso: string, endIso: string) {
    const start = DateTime.fromISO(startIso)
    const end = DateTime.fromISO(endIso)
    if (!start.isValid || !end.isValid || end <= start) return null
    return { start, end }
  }
}
