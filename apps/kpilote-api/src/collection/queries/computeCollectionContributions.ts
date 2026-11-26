import { type SensSouhaite } from '@pilote/kpilote-shared/indicateur'

import { type Bucket, compareBuckets } from '@/framework/bucket'
import { withConcurrency } from '@/framework/concurrency'
import { type Decimal } from '@/framework/decimal'
import { type IndicateurContribution } from '@/collection/resolveCollectionTauxProgression'
import { computeTauxProgressionPoints } from '@/valeurAvancement/computeTauxProgressionPoints'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

// Aligné sur /indicateurs/:id/taux-progression : `month/month` est le défaut
// documenté. Pas exposé en query côté collection en v0.
const DATE_TRUNC_VALEUR = 'month' as const
const DATE_TRUNC_OBJECTIF = 'month' as const

type CollectionIndicateurRef = {
  ponderation: Decimal
  indicateur: { id: string; publicId: string; sensSouhaite: SensSouhaite }
}

export const computeContributions = ({
  indicateurs,
  individuCible,
}: {
  indicateurs: CollectionIndicateurRef[]
  individuCible: IndividuRef
}): Promise<IndicateurContribution[]> =>
  withConcurrency(
    indicateurs.map(({ indicateur, ponderation }) => async () => {
      const lastTaux = await computeLastTaux({
        indicateurId: indicateur.id,
        sensSouhaite: indicateur.sensSouhaite,
        individuCible,
      })
      return {
        indicateurPublicId: indicateur.publicId,
        tauxProgression: lastTaux?.tauxProgression ?? null,
        date: lastTaux?.date ?? null,
        ponderation,
        sensSouhaite: indicateur.sensSouhaite,
      }
    }),
  )

const computeLastTaux = async ({
  indicateurId,
  sensSouhaite,
  individuCible,
}: {
  indicateurId: string
  sensSouhaite: SensSouhaite
  individuCible: IndividuRef
}): Promise<{ tauxProgression: number | null; date: Bucket } | null> => {
  const points = await computeTauxProgressionPoints({
    indicateurId,
    sensSouhaite,
    individusCibles: [individuCible],
    dateTruncValeur: DATE_TRUNC_VALEUR,
    dateTruncObjectif: DATE_TRUNC_OBJECTIF,
    lastPointCount: 1,
  })
  if (points.length === 0) return null

  const lastTaux = points.reduce<TauxProgressionPoint>(
    (latest, point) => (compareBuckets(point.date, latest.date) > 0 ? point : latest),
    points[0]!,
  )
  return { tauxProgression: lastTaux.tauxProgression, date: lastTaux.date }
}
