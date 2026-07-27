import crypto from 'node:crypto'

/**
 * Génère un token opaque à transmettre au client (email, URL...), et son
 * hash SHA-256 à stocker en base. On ne stocke jamais le token en clair :
 * seul le hash permet de le retrouver, ce qui limite l'impact d'une fuite
 * de la base de données.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
