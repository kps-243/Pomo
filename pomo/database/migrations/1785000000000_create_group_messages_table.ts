import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'group_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('group_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.text('content').notNullable()
      table.timestamp('deleted_at').nullable()
      table
        .integer('deleted_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['group_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
