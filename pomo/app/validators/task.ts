import vine from '@vinejs/vine'

const STATUSES = ['todo', 'in_progress', 'done'] as const

/**
 * Valide la création d'une task.
 */
export const createTaskValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    description: vine.string().trim().nullable().optional(),
    status: vine.enum(STATUSES).optional(),
    due_date: vine.string().nullable().optional(),
  })
)

/**
 * Valide le réordonnancement d'une todolist.
 */
export const reorderTasksValidator = vine.compile(
  vine.object({
    taskIds: vine.array(vine.number().positive()).minLength(1),
  })
)

/**
 * Valide la mise à jour d'une task.
 */
export const updateTaskValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().nullable().optional(),
    status: vine.enum(STATUSES).optional(),
    due_date: vine.string().nullable().optional(),
  })
)
