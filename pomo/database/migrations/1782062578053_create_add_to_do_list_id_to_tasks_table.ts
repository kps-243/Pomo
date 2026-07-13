import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('to_do_list_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('to_do_lists')
        .onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('to_do_list_id')
    })
  }
}
