import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Group from '#models/group'
import User from '#models/user'

export type GroupInvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export default class GroupInvitation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare groupId: number

  @column()
  declare email: string

  @column()
  declare invitedById: number

  @column({ serializeAs: null })
  declare tokenHash: string

  @column()
  declare status: GroupInvitationStatus

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @belongsTo(() => Group)
  declare group: BelongsTo<typeof Group>

  @belongsTo(() => User, { foreignKey: 'invitedById' })
  declare invitedBy: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
