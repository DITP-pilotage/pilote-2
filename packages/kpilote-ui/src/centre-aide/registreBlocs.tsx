import { parseMediaAlignment, parseMediaSize } from '@pilote/kpilote-shared/mediaLayout'
import { estUrlHttpSure } from '@pilote/kpilote-shared/url'

import { Accordeon } from '../Accordeon'
import { Callout, COULEURS_CALLOUT, type CalloutColor } from '../Callout'
import { IconeCentreAide } from './IconeCentreAide'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'
import { type RegistreBlocs } from './types'

const lireCouleur = (element: Element): CalloutColor => {
  const brut = element.getAttribute('data-color')
  return COULEURS_CALLOUT.includes(brut as CalloutColor) ? (brut as CalloutColor) : 'info'
}

const readMediaLayout = (element: Element) => ({
  alignment: parseMediaAlignment(element.getAttribute('data-align')),
  size: parseMediaSize(element.getAttribute('data-largeur')),
})

export const registreBlocs: RegistreBlocs = {
  callout: {
    type: 'callout',
    dataType: 'callout',
    rendreDepuisElement: (element, rendreEnfants) => (
      <Callout color={lireCouleur(element)}>{rendreEnfants(element)}</Callout>
    ),
  },
  'accordion-item': {
    type: 'accordion-item',
    dataType: 'accordion-item',
    rendreDepuisElement: (element, rendreEnfants) => (
      <Accordeon titre={element.getAttribute('data-title') ?? 'Titre'}>
        {rendreEnfants(element)}
      </Accordeon>
    ),
  },
  image: {
    type: 'image',
    dataType: 'image',
    rendreDepuisElement: (element) => (
      <ImageCentreAide
        src={element.getAttribute('src') ?? ''}
        alt={element.getAttribute('alt') ?? ''}
        {...readMediaLayout(element)}
      />
    ),
  },
  icone: {
    type: 'icone',
    dataType: 'icone',
    rendreDepuisElement: (element) => (
      <IconeCentreAide type={element.getAttribute('data-icon-type') ?? 'info'} />
    ),
  },
  video: {
    type: 'video',
    dataType: 'video',
    rendreDepuisElement: (element) => {
      const src = element.getAttribute('data-src') ?? ''
      if (!estUrlHttpSure(src)) return null
      return <VideoCentreAide src={src} {...readMediaLayout(element)} />
    },
  },
}
