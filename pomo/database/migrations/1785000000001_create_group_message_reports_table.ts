import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'group_message_reports'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('group_message_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('group_messages')
        .onDelete('CASCADE')
      table
        .integer('reporter_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .enum('reason', ['spam', 'harassment', 'inappropriate', 'other'])
        .notNullable()
        .defaultTo('other')
      table.text('comment').nullable()
      table.enum('status', ['pending', 'reviewed', 'dismissed']).notNullable().defaultTo('pending')
      table
        .integer('reviewed_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('reviewed_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.unique(['group_message_id', 'reporter_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
