import {
  DEFAULT_MEDIA_ALIGNMENT,
  DEFAULT_MEDIA_SIZE,
  parseMediaAlignment,
  parseMediaSize,
} from '@pilote/kpilote-shared/mediaLayout'
import type { Attributes } from '@tiptap/core'

// Une valeur par défaut n'est pas écrite : rouvrir un ancien article ne modifie pas son
// HTML.
export const mediaLayoutAttributes: Attributes = {
  alignment: {
    default: DEFAULT_MEDIA_ALIGNMENT,
    parseHTML: (element) => parseMediaAlignment(element.getAttribute('data-align')),
    renderHTML: ({ alignment }) =>
      alignment === DEFAULT_MEDIA_ALIGNMENT ? {} : { 'data-align': parseMediaAlignment(alignment) },
  },
  size: {
    default: DEFAULT_MEDIA_SIZE,
    parseHTML: (element) => parseMediaSize(element.getAttribute('data-largeur')),
    renderHTML: ({ size }) =>
      size === DEFAULT_MEDIA_SIZE ? {} : { 'data-largeur': parseMediaSize(size) },
  },
}
