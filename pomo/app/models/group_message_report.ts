import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import GroupMessage from '#models/group_message'
import User from '#models/user'

export type GroupMessageReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other'
export type GroupMessageReportStatus = 'pending' | 'reviewed' | 'dismissed'

export const REPORT_REASONS: GroupMessageReportReason[] = [
  'spam',
  'harassment',
  'inappropriate',
  'other',
]

export default class GroupMessageReport extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare groupMessageId: number

  @column()
  declare reporterId: number

  @column()
  declare reason: GroupMessageReportReason

  @column()
  declare comment: string | null

  @column()
  declare status: GroupMessageReportStatus

  @column()
  declare reviewedByUserId: number | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @belongsTo(() => GroupMessage)
  declare groupMessage: BelongsTo<typeof GroupMessage>

  @belongsTo(() => User, { foreignKey: 'reporterId' })
  declare reporter: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare reviewedBy: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
