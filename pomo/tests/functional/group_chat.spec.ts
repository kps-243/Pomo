import { test } from '@japa/runner'
import { io as connectClient, type Socket } from 'socket.io-client'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import GroupMessage from '#models/group_message'
import GroupMessageReport from '#models/group_message_report'
import User from '#models/user'
import { issueChatTicket } from '#services/chat_ticket'
import { WS_PATH, startWsServer } from '#services/ws'
import { listMessages } from '#services/group_chat_service'

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3333}`
const EMAILS = ['owner-chat@example.com', 'member-chat@example.com', 'outsider-chat@example.com']

let openSockets: Socket[] = []

/**
 * Ouvre une connexion cliente et résout à la connexion, ou rejette avec le
 * message d'erreur renvoyé par le middleware d'authentification du gateway.
 */
function connect(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = connectClient(BASE_URL, {
      path: WS_PATH,
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
    })
    openSockets.push(socket)

    socket.on('connect', () => resolve(socket))
    socket.on('connect_error', (error) => reject(error))
  })
}

function emit<T = any>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => socket.emit(event, payload, resolve))
}

function once<T = any>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve))
}

function groupReports(groupId: number) {
  return GroupMessageReport.query().whereIn(
    'group_message_id',
    db.from('group_messages').select('id').where('group_id', groupId)
  )
}

/**
 * Ne supprime que les données créées par ce fichier : les tests tournent dans
 * le conteneur, sur la base applicative, un `delete()` global effacerait des
 * données hors périmètre.
 */
async function cleanupData() {
  const userRows = await db.from('users').select('id').whereIn('email', EMAILS)
  const userIds = userRows.map((row) => row.id)
  if (!userIds.length) {
    return
  }

  const groupRows = await db.from('groups').select('id').whereIn('owner_id', userIds)
  const groupIds = groupRows.map((row) => row.id)

  if (groupIds.length) {
    const messageIds = db.from('group_messages').select('id').whereIn('group_id', groupIds)
    await db.from('group_message_reports').whereIn('group_message_id', messageIds).delete()
    await db.from('group_messages').whereIn('group_id', groupIds).delete()
    await db.from('group_members').whereIn('group_id', groupIds).delete()
    await db.from('groups').whereIn('id', groupIds).delete()
  }

  await db.from('users').whereIn('id', userIds).delete()
}

test.group('Group chat', (group) => {
  let owner: User
  let member: User
  let outsider: User
  let sharedGroup: Group

  group.setup(async () => {
    // Le serveur WebSocket n'est pas démarré par le provider hors environnement
    // web : en test, le serveur HTTP est monté par la suite Japa, on attache
    // donc socket.io juste après.
    await startWsServer(app)
  })

  group.each.setup(async () => {
    await cleanupData()

    owner = await User.create({
      first_name: 'Own',
      last_name: 'Er',
      email: EMAILS[0],
      password: 'password123',
      username: null,
    })
    member = await User.create({
      first_name: 'Mem',
      last_name: 'Ber',
      email: EMAILS[1],
      password: 'password123',
      username: null,
    })
    outsider = await User.create({
      first_name: 'Out',
      last_name: 'Sider',
      email: EMAILS[2],
      password: 'password123',
      username: null,
    })

    sharedGroup = await Group.create({ name: 'Groupe tchat', ownerId: owner.id })
    await sharedGroup.related('members').attach({
      [owner.id]: { role: 'owner' },
      [member.id]: { role: 'member' },
    })
  })

  group.each.teardown(async () => {
    for (const socket of openSockets) {
      socket.removeAllListeners()
      socket.disconnect()
    }
    openSockets = []
    await cleanupData()
  })

  test('refuse une handshake sans jeton valide', async ({ assert }) => {
    await assert.rejects(() => connect('jeton-bidon'))
  })

  test('refuse un utilisateur qui n’est pas membre du groupe', async ({ assert }) => {
    const ticket = issueChatTicket({ userId: outsider.id, groupId: sharedGroup.id })
    await assert.rejects(() => connect(ticket))
  })

  test('diffuse un message à tous les membres connectés', async ({ assert }) => {
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )

    const received = once(memberSocket, 'chat:new')
    const ack = await emit(ownerSocket, 'chat:send', { content: 'Bonjour à tous' })
    const broadcast = await received

    assert.isTrue(ack.ok)
    assert.equal(ack.data.content, 'Bonjour à tous')
    assert.equal(ack.data.author.id, owner.id)
    assert.equal(broadcast.content, 'Bonjour à tous')
  })

  test('un message vide est rejeté et rien n’est persisté', async ({ assert }) => {
    const socket = await connect(issueChatTicket({ userId: member.id, groupId: sharedGroup.id }))

    const ack = await emit(socket, 'chat:send', { content: '   ' })
    const stored = await GroupMessage.query().where('group_id', sharedGroup.id)

    assert.isFalse(ack.ok)
    assert.equal(ack.code, 'invalid')
    assert.lengthOf(stored, 0)
  })

  test('l’auteur supprime son message : masqué pour tous mais conservé en base', async ({
    assert,
  }) => {
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )

    const sent = await emit(memberSocket, 'chat:send', { content: 'À supprimer' })
    const deletedEvent = once<{ id: number }>(ownerSocket, 'chat:deleted')
    const ack = await emit(memberSocket, 'chat:delete', { messageId: sent.data.id })
    const broadcast = await deletedEvent

    assert.isTrue(ack.ok)
    assert.equal(broadcast.id, sent.data.id)

    // Invisible côté lecture…
    assert.lengthOf(await listMessages(sharedGroup.id), 0)

    // …mais toujours présent en base, avec la trace de qui a supprimé.
    const stored = await GroupMessage.findOrFail(sent.data.id)
    assert.equal(stored.content, 'À supprimer')
    assert.isNotNull(stored.deletedAt)
    assert.equal(stored.deletedByUserId, member.id)
  })

  test('le propriétaire peut supprimer le message d’un membre', async ({ assert }) => {
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )

    const sent = await emit(memberSocket, 'chat:send', { content: 'Message litigieux' })
    const ack = await emit(ownerSocket, 'chat:delete', { messageId: sent.data.id })

    assert.isTrue(ack.ok)
    const stored = await GroupMessage.findOrFail(sent.data.id)
    assert.equal(stored.deletedByUserId, owner.id)
  })

  test('un membre ne peut pas supprimer le message d’un autre membre', async ({ assert }) => {
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )

    const sent = await emit(ownerSocket, 'chat:send', { content: 'Message du proprio' })
    const ack = await emit(memberSocket, 'chat:delete', { messageId: sent.data.id })

    assert.isFalse(ack.ok)
    assert.equal(ack.code, 'forbidden')
    const stored = await GroupMessage.findOrFail(sent.data.id)
    assert.isNull(stored.deletedAt)
  })

  test('un membre signale le message d’un autre, mais pas le sien', async ({ assert }) => {
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )

    const sent = await emit(ownerSocket, 'chat:send', { content: 'Message signalé' })

    const reportAck = await emit(memberSocket, 'chat:report', {
      messageId: sent.data.id,
      reason: 'harassment',
      comment: 'Propos déplacés',
    })
    assert.isTrue(reportAck.ok)

    const ownReportAck = await emit(ownerSocket, 'chat:report', {
      messageId: sent.data.id,
      reason: 'spam',
    })
    assert.isFalse(ownReportAck.ok)
    assert.equal(ownReportAck.code, 'invalid')

    const reports = await groupReports(sharedGroup.id)
    assert.lengthOf(reports, 1)
    assert.equal(reports[0].reason, 'harassment')
    assert.equal(reports[0].reporterId, member.id)
    assert.equal(reports[0].status, 'pending')
  })

  test('un second signalement du même membre ne crée pas de doublon', async ({ assert }) => {
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )

    const sent = await emit(ownerSocket, 'chat:send', { content: 'Message signalé deux fois' })
    await emit(memberSocket, 'chat:report', { messageId: sent.data.id, reason: 'spam' })
    await emit(memberSocket, 'chat:report', { messageId: sent.data.id, reason: 'other' })

    const reports = await groupReports(sharedGroup.id)
    assert.lengthOf(reports, 1)
    assert.equal(reports[0].reason, 'other')
  })

  test('GET /groups/:id/messages sert l’historique aux membres seulement', async ({
    client,
    assert,
  }) => {
    const socket = await connect(issueChatTicket({ userId: member.id, groupId: sharedGroup.id }))
    const first = await emit(socket, 'chat:send', { content: 'Premier' })
    await emit(socket, 'chat:send', { content: 'Second' })
    await emit(socket, 'chat:delete', { messageId: first.data.id })

    const asMember = await client.get(`/groups/${sharedGroup.id}/messages`).loginAs(member)
    asMember.assertStatus(200)
    const { messages } = asMember.body()
    assert.lengthOf(messages, 1)
    assert.equal(messages[0].content, 'Second')

    const asOutsider = await client.get(`/groups/${sharedGroup.id}/messages`).loginAs(outsider)
    asOutsider.assertStatus(403)
  })

  test('la file de signalements est réservée au propriétaire', async ({ client, assert }) => {
    const ownerSocket = await connect(
      issueChatTicket({ userId: owner.id, groupId: sharedGroup.id })
    )
    const memberSocket = await connect(
      issueChatTicket({ userId: member.id, groupId: sharedGroup.id })
    )

    const sent = await emit(ownerSocket, 'chat:send', { content: 'Contenu signalé' })
    await emit(memberSocket, 'chat:report', { messageId: sent.data.id, reason: 'inappropriate' })

    const asMember = await client.get(`/groups/${sharedGroup.id}/reports`).loginAs(member)
    asMember.assertStatus(403)

    const asOwner = await client.get(`/groups/${sharedGroup.id}/reports`).loginAs(owner)
    asOwner.assertStatus(200)
    const { reports } = asOwner.body()
    assert.lengthOf(reports, 1)
    assert.equal(reports[0].message.content, 'Contenu signalé')
    assert.equal(reports[0].status, 'pending')

    const resolved = await client
      .put(`/groups/${sharedGroup.id}/reports/${reports[0].id}`)
      .json({ status: 'reviewed' })
      .loginAs(owner)
    resolved.assertStatus(204)

    const stored = await GroupMessageReport.findOrFail(reports[0].id)
    assert.equal(stored.status, 'reviewed')
    assert.equal(stored.reviewedByUserId, owner.id)
  })
})
