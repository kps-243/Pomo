import type { HttpContext } from '@adonisjs/core/http'
import Task from '#models/task'

export default class TasksController {
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