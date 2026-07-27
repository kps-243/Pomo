import { Server as SocketServer } from 'socket.io'
import type { ApplicationService } from '@adonisjs/core/types'
import { registerChatGateway } from '#services/group_chat_gateway'

/**
 * Chemin de la handshake. Distinct des routes AdonisJS pour éviter toute
 * collision avec le routeur HTTP.
 */
export const WS_PATH = '/ws'

let io: SocketServer | null = null

export function getWsServer(): SocketServer | null {
  return io
}

/**
 * Attache socket.io au serveur Node sous-jacent d'AdonisJS.
 *
 * Renvoie null si le serveur HTTP n'a pas encore été créé — c'est le cas dans
 * les environnements `console` et `test`, où le serveur est démarré à la
 * demande par `testUtils.httpServer().start()`. Les tests appellent donc cette
 * fonction eux-mêmes après avoir démarré le serveur.
 *
 * Idempotent : plusieurs appels renvoient la même instance.
 */
export async function startWsServer(app: ApplicationService): Promise<SocketServer | null> {
  if (io) {
    return io
  }

  const server = await app.container.make('server')
  const nodeServer = server.getNodeServer()
  if (!nodeServer) {
    return null
  }

  io = new SocketServer(nodeServer, {
    path: WS_PATH,
    transports: ['websocket'],
    serveClient: false,
  })

  registerChatGateway(io)
  return io
}

export async function stopWsServer(): Promise<void> {
  if (!io) {
    return
  }

  const server = io
  io = null
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
