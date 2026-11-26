import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'
import { type Interpretation, interpretDifference } from '@pilote/kpilote-shared/interpretation'
import { type PillTone } from '@pilote/kpilote-ui/Pill'

import { displayedDifferenceSign } from '@/lib/format'

// Lecture selon le sens souhaité (PIL-1778) : vert favorable, rouge défavorable,
// bleu neutre. Le mot affiché porte la même information sans la couleur (RGAA 3.1).
export const TONE_BY_INTERPRETATION: Record<Interpretation, PillTone> = {
  favorable: 'success',
  unfavorable: 'error',
  neutral: 'info',
}

export type VariationDisplay = {
  arrow: '↑' | '↓' | '→'
  direction: 'EN HAUSSE' | 'EN BAISSE' | 'STABLE'
  interpretation: Interpretation
}

// Flèche et sens décrivent le mouvement réel ; l'interprétation le lit selon le sens
// souhaité. Tous suivent le signe affiché : une variation lue « 0 » est stable.
export const describeVariation = ({
  variation,
  sensSouhaite,
}: {
  variation: number
  sensSouhaite: SensSouhaite
}): VariationDisplay => {
  const sign = displayedDifferenceSign(variation)
  const interpretation = interpretDifference({ difference: sign, sensSouhaite })
  if (sign > 0) return { arrow: '↑', direction: 'EN HAUSSE', interpretation }
  if (sign < 0) return { arrow: '↓', direction: 'EN BAISSE', interpretation }
  return { arrow: '→', direction: 'STABLE', interpretation }
}
