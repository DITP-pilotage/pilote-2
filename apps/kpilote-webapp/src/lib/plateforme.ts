/**
 * Vrai si l'utilisateur est sur un appareil Apple (macOS/iOS). Sert à adapter
 * l'affichage des raccourcis clavier (⌘ sur Apple, Ctrl ailleurs). À n'appeler
 * que côté client : renvoie `false` si `navigator` est indisponible (SSR).
 */
export const estApple = (): boolean => {
  if (typeof navigator === 'undefined') return false
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
}
