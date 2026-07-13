import vine from '@vinejs/vine'

/**
 * Valide la création d'une todolist
 */
export const createToDoListValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
  })
)

/**
 * Valide la mise à jour d'une todolist
 */
export const updateToDoListValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
  })
)
