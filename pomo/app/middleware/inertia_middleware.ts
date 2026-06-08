// start/middleware/CustomInertiaMiddleware.ts
import InertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import type { HttpContext } from '@adonisjs/core/http'

export default class CustomInertiaMiddleware extends InertiaMiddleware {
  /**
   * Share data with all Inertia responses
   */
  public share(ctx: HttpContext) {
    const parent = super.share(ctx) // récupère tout ce que le middleware officiel partage

    const { auth } = ctx as Partial<HttpContext>

    return {
      ...parent,

      // User connecté
      user: auth?.user
        ? {
            id: auth.user.id,
            first_name: auth.user.first_name,
            last_name: auth.user.last_name,
            email: auth.user.email,
          }
        : null,
    }
  }
}