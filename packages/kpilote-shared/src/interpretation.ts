import { type SensSouhaite } from './indicateur'

export type Interpretation = 'favorable' | 'unfavorable' | 'neutral'

// Sens du mouvement constaté entre deux valeurs, indépendant du sens souhaité.
export const DIRECTIONS_VARIATION = ['HAUSSE', 'BAISSE', 'STABLE'] as const
export type DirectionVariation = (typeof DIRECTIONS_VARIATION)[number]

export const directionOfDifference = (difference: number): DirectionVariation => {
  if (difference > 0) return 'HAUSSE'
  if (difference < 0) return 'BAISSE'
  return 'STABLE'
}

// Interprète une différence signée (variation, écart à la médiane) selon le sens
// souhaité de l'indicateur (PIL-1778) : plus haut est favorable à la hausse,
// défavorable à la baisse ; une différence nulle est neutre dans les deux sens.
export const interpretDifference = ({
  difference,
  sensSouhaite,
}: {
  difference: number
  sensSouhaite: SensSouhaite
}): Interpretation => {
  if (difference === 0) return 'neutral'
  return difference > 0 === (sensSouhaite === 'HAUSSE') ? 'favorable' : 'unfavorable'
}

// Le maximum est favorable à la hausse, défavorable à la baisse ; le minimum, l'inverse.
// Deux extrêmes égaux (référentiel à un seul individu) n'ont pas d'écart à
// interpréter : une même valeur ne peut pas être favorable et défavorable à la fois.
// L'appelant compare les valeurs telles qu'il les affiche.
export const interpretExtremes = ({
  sensSouhaite,
  sameValue,
}: {
  sensSouhaite: SensSouhaite
  sameValue: boolean
}): { max: Interpretation; min: Interpretation } =>
  sameValue
    ? { max: 'neutral', min: 'neutral' }
    : {
        max: interpretDifference({ difference: 1, sensSouhaite }),
        min: interpretDifference({ difference: -1, sensSouhaite }),
      }
