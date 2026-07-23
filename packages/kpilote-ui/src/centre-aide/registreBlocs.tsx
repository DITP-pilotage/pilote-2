import { Accordeon } from './Accordeon'
import { Callout } from './Callout'
import { IconeCentreAide } from './IconeCentreAide'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'
import { estUrlHttpSure } from './securiteUrl'
import { COULEURS_CALLOUT, type CalloutColor, type RegistreBlocs } from './types'

const lireCouleur = (element: Element): CalloutColor => {
  const brut = element.getAttribute('data-color')
  return COULEURS_CALLOUT.includes(brut as CalloutColor) ? (brut as CalloutColor) : 'info'
}

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
      return <VideoCentreAide src={src} />
    },
  },
}
