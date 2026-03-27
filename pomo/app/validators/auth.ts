import vine from '@vinejs/vine'

/**
 * Validates the register action
 */
export const registerValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(2).nullable(),
    first_name: vine.string().trim().minLength(2),
    last_name: vine.string().trim().minLength(2),
    email: vine
      .string()
      .trim()
      .normalizeEmail()
      .email()
      .unique(async (db, value) => {
        const result = await db.from('users').select('id').where('email', value)
        return result.length ? false : true
      }),
    password: vine.string().trim().minLength(8),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().normalizeEmail().email(),
    password: vine.string().trim().minLength(8),
  })
)

/**
 * Validates the user's update action
 */
export const updateUserValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(2).nullable(),
    first_name: vine.string().trim().minLength(2),
    last_name: vine.string().trim().minLength(2),
    password: vine.string().trim().minLength(8),
  })
)
