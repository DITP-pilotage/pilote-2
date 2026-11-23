// Hébergeurs autorisés pour les médias. La CSP de la webapp et de l'admin est construite
// à partir de ces origines : un média hébergé ailleurs serait bloqué par le navigateur.
export const FICHIERS_ORIGIN = 'https://fichiers.numerique.gouv.fr'
export const VIDEO_FINANCES_ORIGIN = 'https://video.finances.gouv.fr'

export type MediaKind = 'image' | 'video'

export const MEDIA_ORIGINS: Record<MediaKind, readonly string[]> = {
  image: [FICHIERS_ORIGIN],
  video: [VIDEO_FINANCES_ORIGIN, FICHIERS_ORIGIN],
}

export const MEDIA_EXTENSIONS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  video: ['mp4', 'webm'],
} as const satisfies Record<MediaKind, readonly string[]>

// Seul ce chemin sert le binaire : les autres adresses rendent la page du fichier, qu'un
// lecteur ne sait pas jouer.
const FICHIERS_MEDIA_PATH = '/media/preview/item/'
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export const isAllowedMediaUrl = ({ kind, url }: { kind: MediaKind; url: string }): boolean => {
  const parsed = parseUrl(url)
  return parsed !== null && MEDIA_ORIGINS[kind].includes(parsed.origin)
}

export const isFichiersUrl = (url: string): boolean => parseUrl(url)?.origin === FICHIERS_ORIGIN

export const isFichiersMediaUrl = (url: string): boolean =>
  isFichiersUrl(url) && parseUrl(url)?.pathname.startsWith(FICHIERS_MEDIA_PATH) === true

export const extractFichiersItemId = (url: string): string | null => {
  const parsed = parseUrl(url)
  if (parsed?.origin !== FICHIERS_ORIGIN) return null
  return UUID_PATTERN.exec(parsed.pathname)?.[0] ?? null
}

export const buildFichiersMediaUrl = ({
  itemId,
  fileName,
  extension,
}: {
  itemId: string
  fileName: string
  extension: string
}): string =>
  `${FICHIERS_ORIGIN}${FICHIERS_MEDIA_PATH}${itemId}/${encodeURIComponent(fileName)}.${extension}`
