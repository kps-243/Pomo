import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Group from '#models/group'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare first_name: string

  @column()
  declare last_name: string

  @column({ serializeAs: null })
  declare twoFactorSecret: string | null

  @column()
  declare twoFactorEnabled: boolean

  @column({ serializeAs: null })
  declare calendarToken: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => Group, {
    pivotTable: 'group_members',
    pivotColumns: ['role'],
    pivotTimestamps: true,
  })
  declare groups: ManyToMany<typeof Group>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  /**
   * Renvoie le token du flux calendrier de l'utilisateur, en le générant
   * au premier appel (utilisé pour l'URL d'abonnement iCal publique).
   */
  async ensureCalendarToken(): Promise<string> {
    if (!this.calendarToken) {
      this.calendarToken = randomBytes(32).toString('hex')
      await this.save()
    }
    return this.calendarToken
  }
}
