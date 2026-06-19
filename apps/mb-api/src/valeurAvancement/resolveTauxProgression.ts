import { type Bucket, compareBuckets } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'

export type ValeurBrute = {
  individuId: string
  individuPublicId: string
  date: Bucket
  valeur: Decimal
}

export type ObjectifBrut = {
  dateCible: Bucket
  valeurCible: Decimal
}

export type TauxProgressionPoint = {
  individuId: string
  individuPublicId: string
  date: Bucket
  valeur: Decimal
  valeurCible: Decimal
  dateCible: Bucket
  tauxProgression: number | null
}

// objectifs doit être trié par dateCible ASC
// Objectif applicable = premier objectif dont la `dateCible` ≥ date de la
// valeur (l'objectif courant que la valeur cherche à atteindre). Le `>=` est
// volontaire : la bucketisation ramène valeur et `dateCible` au 1er du bucket,
// donc une valeur de juin 2024 et un objectif fixé au 30 juin 2024 finissent
// tous deux sur `2024-06-01` ; un `>` strict sauterait à l'objectif suivant et
// fausserait `tauxProgression` pour tout le bucket de l'échéance.
export const findObjectifApplicable = (
  valeurDate: Bucket,
  objectifs: ReadonlyArray<ObjectifBrut>,
): ObjectifBrut | null => {
  if (objectifs.length === 0) return null
  return (
    objectifs.find((o) => compareBuckets(o.dateCible, valeurDate) >= 0) ??
    objectifs[objectifs.length - 1]!
  )
}

const CENT = new Decimal(100)

export const computeTaux = (valeur: Decimal, valeurCible: Decimal): number | null => {
  if (valeurCible.isZero()) return null
  const taux = valeur.div(valeurCible).mul(CENT)
  // Tronqué (et non arrondi half-up) pour ne jamais afficher 100 % tant que la
  // valeur est strictement inférieure à la cible : avec un half-up, 99,995 %
  // remonterait à 100,00 et masquerait l'atteinte incomplète de l'objectif.
  return Decimal.min(CENT, taux).toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber()
}

export const resolveTauxProgression = ({
  valeurs,
  objectifsParIndividu,
}: {
  valeurs: ReadonlyArray<ValeurBrute>
  // valeurs dans chaque liste triées par dateCible ASC
  objectifsParIndividu: Map<string, ReadonlyArray<ObjectifBrut>>
}): TauxProgressionPoint[] => {
  const points: TauxProgressionPoint[] = []

  for (const valeur of valeurs) {
    const objectifs = objectifsParIndividu.get(valeur.individuId)
    if (!objectifs || objectifs.length === 0) continue

    const objectif = findObjectifApplicable(valeur.date, objectifs)
    if (!objectif) continue

    points.push({
      individuId: valeur.individuId,
      individuPublicId: valeur.individuPublicId,
      date: valeur.date,
      valeur: valeur.valeur,
      valeurCible: objectif.valeurCible,
      dateCible: objectif.dateCible,
      tauxProgression: computeTaux(valeur.valeur, objectif.valeurCible),
    })
  }

  return points
}
