/**
 * Lit le cookie XSRF-TOKEN posé par Shield, à renvoyer tel quel dans l'en-tête
 * `x-xsrf-token` des requêtes non-GET faites en `fetch`.
 *
 * La valeur n'est volontairement pas décodée : Shield applique lui-même
 * `decodeURIComponent` avant de retirer le préfixe `e:` et de déchiffrer.
 */
export function xsrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
  return match ? { 'x-xsrf-token': match[1] } : {}
}
