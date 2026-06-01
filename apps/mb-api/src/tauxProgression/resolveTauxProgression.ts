import { Decimal } from '@/framework/decimal'

export type ValeurBrute = {
  individuId: string
  individuPublicId: string
  date: string
  valeur: Decimal
}

export type ObjectifBrut = {
  dateCible: string
  valeurCible: Decimal
}

export type TauxProgressionPoint = {
  individuId: string
  individuPublicId: string
  date: string
  valeur: Decimal
  valeurCible: Decimal
  dateCible: string
  tauxProgression: number | null
}

// objectifs doit être trié par dateCible ASC
const findObjectifApplicable = (
  valeurDate: string,
  objectifs: ReadonlyArray<ObjectifBrut>,
): ObjectifBrut | null => {
  if (objectifs.length === 0) return null
  return objectifs.find((o) => o.dateCible > valeurDate) ?? objectifs[objectifs.length - 1]!
}

const computeTaux = (valeur: Decimal, valeurCible: Decimal): number | null => {
  if (valeurCible.isZero()) return null
  const taux = valeur.div(valeurCible).mul(100).toNumber()
  return Math.min(100, taux)
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
