import { type Decimal } from '@/framework/decimal'

// Médiane en décimal exact, convertie en number seulement à la sortie de l'API.
// Une médiane déjà convertie, soustraite à une valeur dérivée (moyenne) en
// décimal, laisserait un écart résiduel (≈ 1e-13) à l'individu situé à la médiane.
export const computeMediane = (values: ReadonlyArray<Decimal>): Decimal | null => {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a.comparedTo(b))
  const middle = sorted.length / 2

  if (sorted.length % 2 === 1) {
    return sorted[Math.floor(middle)]!
  }
  return sorted[middle - 1]!.plus(sorted[middle]!).div(2)
}
