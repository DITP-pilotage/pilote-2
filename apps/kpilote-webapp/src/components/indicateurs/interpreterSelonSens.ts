import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'

export type Interpretation = 'favorable' | 'defavorable' | 'neutre'

// Interprète une différence signée (variation, écart à la médiane) selon le sens
// souhaité de l'indicateur (PIL-1778) : plus haut est favorable à la hausse,
// défavorable à la baisse ; une différence nulle est neutre dans les deux sens.
export const interpreterSelonSens = (ecart: number, sensSouhaite: SensSouhaite): Interpretation => {
  if (ecart === 0) return 'neutre'
  const monte = ecart > 0
  return monte === (sensSouhaite === 'HAUSSE') ? 'favorable' : 'defavorable'
}

// Le maximum est favorable à la hausse, défavorable à la baisse ; le minimum, l'inverse.
// Quand ils sont égaux (référentiel à un seul individu), il n'y a pas d'écart à
// interpréter : une même valeur ne peut pas être favorable et défavorable à la fois.
export const interpreterValeursExtremes = (
  { min, max }: { min: number | null; max: number | null },
  sensSouhaite: SensSouhaite,
): { max: Interpretation; min: Interpretation } =>
  min !== null && min === max
    ? { max: 'neutre', min: 'neutre' }
    : { max: interpreterSelonSens(1, sensSouhaite), min: interpreterSelonSens(-1, sensSouhaite) }
