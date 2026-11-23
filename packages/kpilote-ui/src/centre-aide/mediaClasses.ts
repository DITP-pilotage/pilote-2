import type { MediaAlignment, MediaSize } from '@pilote/kpilote-shared/mediaLayout'

// L'alignement se joue sur les marges : un média est un bloc, text-align n'a aucun
// effet dessus.
const ALIGNMENT_CLASSES: Record<MediaAlignment, string> = {
  gauche: 'mr-auto',
  centre: 'mx-auto',
  droite: 'ml-auto',
}

const SIZE_CLASSES: Record<MediaSize, string> = {
  petite: 'max-w-[min(320px,100%)]',
  moyenne: 'max-w-[min(560px,100%)]',
  pleine: 'max-w-full',
}

export const mediaClasses = ({
  alignment,
  size,
}: {
  alignment: MediaAlignment
  size: MediaSize
}): string => `block ${SIZE_CLASSES[size]} ${ALIGNMENT_CLASSES[alignment]}`
