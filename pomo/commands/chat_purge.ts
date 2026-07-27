import { DateTime } from 'luxon'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import GroupMessage from '#models/group_message'

export const DEFAULT_RETENTION_DAYS = 30

/**
 * Efface définitivement les messages supprimés depuis plus de N jours.
 *
 * La suppression logique conserve le contenu pour permettre au propriétaire du
 * groupe de traiter un signalement portant sur un message déjà retiré. Cette
 * conservation doit être bornée dans le temps : passé le délai de modération,
 * la donnée n'a plus de finalité et doit être effacée.
 *
 * À brancher sur une tâche planifiée (cron quotidien) :
 *   node ace chat:purge --days=30
 */
export default class ChatPurge extends BaseCommand {
  static commandName = 'chat:purge'
  static description =
    'Efface définitivement les messages de tchat supprimés depuis plus de N jours'
  static options: CommandOptions = { startApp: true }

  @flags.number({
    description: `Durée de rétention en jours (défaut : ${DEFAULT_RETENTION_DAYS})`,
    default: DEFAULT_RETENTION_DAYS,
  })
  declare days: number

  @flags.boolean({
    description: 'Affiche le nombre de messages concernés sans rien effacer',
    default: false,
  })
  declare dryRun: boolean

  async run() {
    const threshold = DateTime.now().minus({ days: this.days })

    const query = GroupMessage.query()
      .whereNotNull('deleted_at')
      .where('deleted_at', '<', threshold.toSQL({ includeOffset: false })!)

    if (this.dryRun) {
      const [{ $extras }] = await query.count('* as total')
      this.logger.info(
        `${$extras.total} message(s) supprimé(s) avant le ${threshold.toISODate()} seraient effacés`
      )
      return
    }

    const deleted = await query.delete()
    this.logger.success(`${deleted} message(s) effacé(s) définitivement`)
  }
}
