import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'
import {
  type DirectionVariation,
  directionOfDifference,
  type Interpretation,
  interpretDifference,
} from '@pilote/kpilote-shared/interpretation'
import { type PillTone } from '@pilote/kpilote-ui/Pill'

import { displayedDifferenceSign } from '@/lib/format'

// Lecture selon le sens souhaité (PIL-1778) : vert favorable, rouge défavorable,
// bleu neutre. Le mot affiché porte la même information sans la couleur (RGAA 3.1).
export const TONE_BY_INTERPRETATION: Record<Interpretation, PillTone> = {
  favorable: 'success',
  unfavorable: 'error',
  neutral: 'info',
}

const ARROW_BY_DIRECTION: Record<DirectionVariation, string> = {
  HAUSSE: '↑',
  BAISSE: '↓',
  STABLE: '→',
}

const LABEL_BY_DIRECTION: Record<DirectionVariation, string> = {
  HAUSSE: 'EN HAUSSE',
  BAISSE: 'EN BAISSE',
  STABLE: 'STABLE',
}

export type VariationDisplay = {
  direction: DirectionVariation
  arrow: string
  label: string
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
  const direction = directionOfDifference(sign)
  return {
    direction,
    arrow: ARROW_BY_DIRECTION[direction],
    label: LABEL_BY_DIRECTION[direction],
    interpretation: interpretDifference({ difference: sign, sensSouhaite }),
  }
}
