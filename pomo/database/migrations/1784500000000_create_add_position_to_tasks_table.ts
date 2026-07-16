import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('position').notNullable().defaultTo(0)
    })

    // Les tasks déjà en base étaient affichées triées par id : on fige cet ordre
    // dans `position`, sinon elles se retrouveraient toutes à 0 et l'ordre d'affichage
    // deviendrait celui, arbitraire, que Postgres renvoie.
    this.defer(async (db) => {
      await db.rawQuery(`
        update tasks
        set position = ordonnees.rang
        from (
          select id, row_number() over (partition by to_do_list_id order by id) - 1 as rang
          from tasks
        ) as ordonnees
        where tasks.id = ordonnees.id
      `)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('position')
    })
  }
}
