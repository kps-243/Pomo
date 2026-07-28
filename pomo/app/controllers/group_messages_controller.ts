import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import {
  ChatError,
  assertMembership,
  listMessages,
  listReports,
  resolveReport,
} from '#services/group_chat_service'
import { listMessagesValidator } from '#validators/group_message'

const resolveReportValidator = vine.compile(
  vine.object({
    status: vine.enum(['reviewed', 'dismissed'] as const),
  })
)

export default class GroupMessagesController {
  /**
   * Traduit une erreur métier du tchat en réponse HTTP. Toute autre exception
   * est relayée au handler d'erreurs global.
   */
  private fail(error: unknown, response: HttpContext['response']) {
    if (!(error instanceof ChatError)) {
      throw error
    }

    const status = { forbidden: 403, not_found: 404, invalid: 422 }[error.code]
    return response.status(status).send({ message: error.message })
  }

  /**
   * GET /groups/:id/messages?before=<id>&limit=<n>
   * Pagination par curseur : `before` est l'id du plus ancien message déjà
   * affiché côté client.
   */
  async index({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const groupId = Number(params.id)

    try {
      await assertMembership(groupId, user.id)
      const { before, limit } = await request.validateUsing(listMessagesValidator, {
        data: request.qs(),
      })

      return response.ok({ messages: await listMessages(groupId, { before, limit }) })
    } catch (error) {
      return this.fail(error, response)
    }
  }

  /**
   * GET /groups/:id/reports — file de modération du propriétaire.
   */
  async reports({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      return response.ok({ reports: await listReports(Number(params.id), user.id) })
    } catch (error) {
      return this.fail(error, response)
    }
  }

  /**
   * PUT /groups/:id/reports/:reportId — clôture d'un signalement.
   */
  async resolveReport({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status } = await request.validateUsing(resolveReportValidator)

    try {
      await resolveReport({
        groupId: Number(params.id),
        reportId: Number(params.reportId),
        userId: user.id,
        status,
      })
      return response.noContent()
    } catch (error) {
      return this.fail(error, response)
    }
  }
}
