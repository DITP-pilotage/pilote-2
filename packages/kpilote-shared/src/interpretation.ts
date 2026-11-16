import { type SensSouhaite } from './indicateur'

export type Interpretation = 'favorable' | 'unfavorable' | 'neutral'

// Interprète une différence signée (variation, écart à la médiane) selon le sens
// souhaité de l'indicateur (PIL-1778) : plus haut est favorable à la hausse,
// défavorable à la baisse ; une différence nulle est neutre dans les deux sens.
export const interpretDifference = (
  difference: number,
  sensSouhaite: SensSouhaite,
): Interpretation => {
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
    : { max: interpretDifference(1, sensSouhaite), min: interpretDifference(-1, sensSouhaite) }
