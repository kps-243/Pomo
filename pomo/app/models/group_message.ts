import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Group from '#models/group'
import User from '#models/user'
import GroupMessageReport from '#models/group_message_report'

export default class GroupMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare groupId: number

  @column()
  declare userId: number

  @column()
  declare content: string

  @column.dateTime()
  declare deletedAt: DateTime | null

  @column()
  declare deletedByUserId: number | null

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'deletedByUserId' })
  declare deletedBy: BelongsTo<typeof User>

  @hasMany(() => GroupMessageReport)
  declare reports: HasMany<typeof GroupMessageReport>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  get isDeleted(): boolean {
    return this.deletedAt !== null
  }
}
