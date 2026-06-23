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
    start_date: vine.string().nullable().optional(),
    duration: vine.number().positive().nullable().optional(),
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
    start_date: vine.string().nullable().optional(),
    duration: vine.number().positive().nullable().optional(),
  })
)
