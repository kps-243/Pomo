import vine from '@vinejs/vine'

/*Valide la création d'un event.*/
export const createEventValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1),
    description: vine.string().trim().nullable().optional(),
    start_date: vine.string(),
    end_date: vine.string().nullable().optional(),
    location: vine.string().trim().nullable().optional(),
  })
)

/*Valide la mise à jour d'un event.*/
export const updateEventValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).optional(),
    description: vine.string().trim().nullable().optional(),
    start_date: vine.string().optional(),
    end_date: vine.string().nullable().optional(),
    location: vine.string().trim().nullable().optional(),
  })
)
