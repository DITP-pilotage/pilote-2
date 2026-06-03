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
const findObjectifApplicable = (
  valeurDate: Bucket,
  objectifs: ReadonlyArray<ObjectifBrut>,
): ObjectifBrut | null => {
  if (objectifs.length === 0) return null
  return (
    objectifs.find((o) => compareBuckets(o.dateCible, valeurDate) > 0) ??
    objectifs[objectifs.length - 1]!
  )
}

const CENT = new Decimal(100)

const computeTaux = (valeur: Decimal, valeurCible: Decimal): number | null => {
  if (valeurCible.isZero()) return null
  const taux = valeur.div(valeurCible).mul(CENT)
  return Decimal.min(CENT, taux).toDecimalPlaces(2).toNumber()
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
