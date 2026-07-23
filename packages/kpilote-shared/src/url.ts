// Helpers d'URL génériques (logique pure, sans dépendance UI).

// Valide qu'une URL est en http(s) absolu — schéma sûr pour un iframe / lien.
export const estUrlHttpSure = (url: string): boolean => {
  try {
    const parsee = new URL(url)
    return parsee.protocol === 'https:' || parsee.protocol === 'http:'
  } catch {
    return false
  }
}

// Retire toute demande d'autoplay d'une URL d'intégration vidéo : la vidéo ne
// doit pas démarrer seule au chargement.
export const sansAutoplay = (src: string): string => {
  try {
    const url = new URL(src)
    for (const cle of ['autoplay', 'auto_play', 'autostart']) url.searchParams.delete(cle)
    return url.toString()
  } catch {
    return src
  }
}
