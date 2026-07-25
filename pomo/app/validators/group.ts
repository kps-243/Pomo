import vine from '@vinejs/vine'

/**
 * Valide la création d'un groupe.
 */
export const createGroupValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    description: vine.string().trim().nullable().optional(),
  })
)

/**
 * Valide la mise à jour d'un groupe.
 */
export const updateGroupValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().nullable().optional(),
  })
)

/**
 * Valide l'invitation d'un membre par email.
 */
export const inviteMemberValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
  })
)
