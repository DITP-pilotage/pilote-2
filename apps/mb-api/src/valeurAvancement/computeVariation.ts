import { Decimal } from '@/framework/decimal'

export const computeVariation = (valeurs: ReadonlyArray<{ valeur: Decimal }>): number | null => {
  if (valeurs.length === 0) return null
  const [recente, precedente] = valeurs
  const precedenteValeur = precedente?.valeur ?? new Decimal(0)
  return recente!.valeur.minus(precedenteValeur).toNumber()
}
