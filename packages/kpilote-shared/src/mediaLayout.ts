// Valeurs écrites dans le HTML des articles, les mêmes que dans l'éditeur de pilote-ppg
// pour qu'un article copié d'un centre d'aide à l'autre garde sa mise en page.
export const MEDIA_ALIGNMENTS = ['gauche', 'centre', 'droite'] as const
export type MediaAlignment = (typeof MEDIA_ALIGNMENTS)[number]

export const MEDIA_SIZES = ['petite', 'moyenne', 'pleine'] as const
export type MediaSize = (typeof MEDIA_SIZES)[number]

// Rendu des médias insérés avant l'existence de la mise en page : ne pas changer ces
// défauts, les articles déjà publiés bougeraient.
export const DEFAULT_MEDIA_ALIGNMENT: MediaAlignment = 'gauche'
export const DEFAULT_MEDIA_SIZE: MediaSize = 'pleine'

export const parseMediaAlignment = (value: unknown): MediaAlignment =>
  MEDIA_ALIGNMENTS.find((alignment) => alignment === value) ?? DEFAULT_MEDIA_ALIGNMENT

export const parseMediaSize = (value: unknown): MediaSize =>
  MEDIA_SIZES.find((size) => size === value) ?? DEFAULT_MEDIA_SIZE
