import { type Bucket, compareBuckets } from '@/framework/bucket'
import { type Decimal } from '@/framework/decimal'
import { type IndicateurContribution } from '@/panier/resolvePanierTauxProgression'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

// Aligné sur /indicateurs/:id/taux-progression : `month/month` est le défaut
// documenté. Pas exposé en query côté panier en v0.
const DATE_TRUNC_VALEUR = 'month' as const
const DATE_TRUNC_OBJECTIF = 'month' as const

type PanierIndicateurRef = {
  ponderation: Decimal
  indicateur: { id: string; publicId: string }
}

export const computeContributions = (
  indicateurs: PanierIndicateurRef[],
  individuCible: IndividuRef,
): Promise<IndicateurContribution[]> =>
  Promise.all(
    indicateurs.map(async ({ indicateur, ponderation }) => {
      const dernier = await computeDernierTaux({ indicateurId: indicateur.id, individuCible })
      return {
        indicateurPublicId: indicateur.publicId,
        tauxProgression: dernier?.tauxProgression ?? null,
        date: dernier?.date ?? null,
        ponderation,
      }
    }),
  )

const computeDernierTaux = async ({
  indicateurId,
  individuCible,
}: {
  indicateurId: string
  individuCible: IndividuRef
}): Promise<{ tauxProgression: number | null; date: Bucket } | null> => {
  const points = await computeTauxProgressionPoints({
    indicateurId,
    individusCibles: [individuCible],
    dateTruncValeur: DATE_TRUNC_VALEUR,
    dateTruncObjectif: DATE_TRUNC_OBJECTIF,
  })
  if (points.length === 0) return null

  const dernier = points.reduce<TauxProgressionPoint>(
    (acc, p) => (compareBuckets(p.date, acc.date) > 0 ? p : acc),
    points[0]!,
  )
  return { tauxProgression: dernier.tauxProgression, date: dernier.date }
}
