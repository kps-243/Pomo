import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'group_invitations'

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
      table.string('email').notNullable()
      table
        .integer('invited_by_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('token_hash').notNullable().unique()
      table
        .enum('status', ['pending', 'accepted', 'expired', 'cancelled'])
        .notNullable()
        .defaultTo('pending')
      table.timestamp('expires_at').notNullable()
      table.timestamp('accepted_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.index(['group_id', 'email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
