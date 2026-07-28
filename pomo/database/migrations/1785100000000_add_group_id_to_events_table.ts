import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('group_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
      table.index('group_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('group_id')
      table.dropColumn('group_id')
    })
  }
}
