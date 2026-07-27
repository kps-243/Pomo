import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Démarre le serveur WebSocket du tchat de groupe.
 *
 * Le hook `ready` s'exécute après le callback de démarrage du serveur HTTP
 * (`app.start()` appelle `setNodeServer` puis les hooks `ready` des providers),
 * donc le serveur Node est bien disponible à ce stade en environnement web.
 */
export default class WsProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    if (this.app.getEnvironment() !== 'web') {
      return
    }

    const { startWsServer } = await import('#services/ws')
    await startWsServer(this.app)
  }

  async shutdown() {
    const { stopWsServer } = await import('#services/ws')
    await stopWsServer()
  }
}
