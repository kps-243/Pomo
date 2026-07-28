import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Tente d'authentifier l'utilisateur via la session, sans bloquer
 * l'accès s'il n'est pas connecté. Utile pour les pages publiques
 * qui veulent afficher un contenu différent selon l'état de connexion
 * (ex: le landing avec "Mon dashboard" vs "Se connecter").
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()
    return next()
  }
}
