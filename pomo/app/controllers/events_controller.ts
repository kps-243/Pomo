import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Event from '#models/event'
import { createEventValidator, updateEventValidator } from '#validators/event'

export default class EventsController {
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
}
