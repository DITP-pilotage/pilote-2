import { type RaisonSansTaux } from '@pilote/kpilote-shared/collectionTauxProgression'
import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'

import { type Bucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'

export type IndicateurContribution = {
  indicateurPublicId: string
  // null = indicateur non calculable (pas de point, ou dernier point avec tauxProgression null)
  tauxProgression: number | null
  date: Bucket | null
  ponderation: Decimal
  sensSouhaite: SensSouhaite
}

export type CollectionTauxProgressionResult = {
  tauxProgression: number | null
  raisonSansTaux: RaisonSansTaux
  contributions: ReadonlyArray<IndicateurContribution>
}

const CENT = new Decimal(100)

// Tronque (ROUND_DOWN) pour la cohérence avec le taux par indicateur :
// ne jamais afficher 100 % tant qu'au moins une contribution n'a pas
// strictement atteint la cible (cf. doc taux-progression.md).
export const resolveCollectionTauxProgression = (
  contributions: ReadonlyArray<IndicateurContribution>,
): CollectionTauxProgressionResult => {
  const sansTaux = (raisonSansTaux: RaisonSansTaux) => ({
    tauxProgression: null,
    raisonSansTaux,
    contributions,
  })
  if (contributions.length === 0) return sansTaux('COLLECTION_VIDE')

  // Pondération 0 = indicateur volontairement exclu du calcul (cf. PIL-1578).
  // L'absence de taux ne bloque pas si l'utilisateur a déjà décidé de l'écarter.
  const ponderees = contributions.filter((c) => !c.ponderation.isZero())
  if (ponderees.length === 0) return sansTaux('AUCUN_INDICATEUR_PONDERE')
  // Règle tout-ou-rien : un indicateur pondéré non calculable invalide la moyenne.
  // Le sens à la baisse est la raison la plus actionnable, elle passe en premier.
  if (ponderees.some((c) => c.sensSouhaite === 'BAISSE')) return sansTaux('INDICATEUR_A_LA_BAISSE')
  const calculables = ponderees.flatMap(({ ponderation, tauxProgression }) =>
    tauxProgression === null ? [] : [{ ponderation, tauxProgression }],
  )
  if (calculables.length < ponderees.length) return sansTaux('INDICATEUR_NON_CALCULABLE')

  let sommePondTaux = new Decimal(0)
  let sommePond = new Decimal(0)
  for (const c of calculables) {
    sommePondTaux = sommePondTaux.plus(c.ponderation.mul(c.tauxProgression))
    sommePond = sommePond.plus(c.ponderation)
  }

  const moyenne = sommePondTaux.div(sommePond)
  const taux = Decimal.min(CENT, moyenne).toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber()
  return { tauxProgression: taux, raisonSansTaux: null, contributions }
}
