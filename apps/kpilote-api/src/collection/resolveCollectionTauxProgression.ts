import { type Bucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'

export type IndicateurContribution = {
  indicateurPublicId: string
  // null = indicateur non calculable (pas de point, ou dernier point avec tauxProgression null)
  tauxProgression: number | null
  date: Bucket | null
  ponderation: Decimal
}

export type CollectionTauxProgressionResult = {
  tauxProgression: number | null
  contributions: ReadonlyArray<IndicateurContribution>
}

const CENT = new Decimal(100)

// Tronque (ROUND_DOWN) pour la cohérence avec le taux par indicateur :
// ne jamais afficher 100 % tant qu'au moins une contribution n'a pas
// strictement atteint la cible (cf. doc taux-progression.md).
export const resolveCollectionTauxProgression = (
  contributions: ReadonlyArray<IndicateurContribution>,
): CollectionTauxProgressionResult => {
  if (contributions.length === 0) {
    return { tauxProgression: null, contributions }
  }

  let sommePondTaux = new Decimal(0)
  let sommePond = new Decimal(0)
  for (const c of contributions) {
    // Pondération 0 = indicateur volontairement exclu du calcul (cf. PIL-1578).
    // L'absence de taux ne bloque pas si l'utilisateur a déjà décidé de l'écarter.
    if (c.ponderation.isZero()) continue
    if (c.tauxProgression === null) {
      // Règle tout-ou-rien : un indicateur pondéré non calculable invalide la moyenne.
      return { tauxProgression: null, contributions }
    }
    sommePondTaux = sommePondTaux.plus(c.ponderation.mul(c.tauxProgression))
    sommePond = sommePond.plus(c.ponderation)
  }

  if (sommePond.isZero()) {
    return { tauxProgression: null, contributions }
  }

  const moyenne = sommePondTaux.div(sommePond)
  const taux = Decimal.min(CENT, moyenne).toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber()
  return { tauxProgression: taux, contributions }
}
