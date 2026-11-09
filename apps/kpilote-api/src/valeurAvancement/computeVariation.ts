import { type Decimal } from '@/framework/decimal'

// Variation entre la valeur la plus récente et la précédente. Une variation
// suppose deux valeurs : avec moins de deux, il n'y a rien à comparer (null).
export const computeVariation = (valeurs: ReadonlyArray<{ valeur: Decimal }>): number | null => {
  const [recente, precedente] = valeurs
  if (!recente || !precedente) return null
  return recente.valeur.minus(precedente.valeur).toNumber()
}
