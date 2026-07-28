import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Task from '#models/task'
import GroupInvitation from '#models/group_invitation'
import GroupMessage from '#models/group_message'

export default class Group extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare ownerId: number

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'group_members',
    pivotColumns: ['role'],
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>

  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  @hasMany(() => GroupInvitation)
  declare invitations: HasMany<typeof GroupInvitation>

  @hasMany(() => GroupMessage)
  declare messages: HasMany<typeof GroupMessage>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
