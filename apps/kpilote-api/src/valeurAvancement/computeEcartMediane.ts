import { type Decimal } from '@/framework/decimal'

export const computeEcartMediane = (
  derniereValeur: Decimal | undefined,
  mediane: Decimal | null,
): number | null => {
  if (derniereValeur === undefined || mediane === null) return null
  return derniereValeur.minus(mediane).toNumber()
}
