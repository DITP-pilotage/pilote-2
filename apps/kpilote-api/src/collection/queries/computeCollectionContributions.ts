import { parseCelluleId } from '@pilote/kpilote-shared/cellule'

import { type Bucket, compareBuckets } from '@/framework/bucket'
import { withConcurrency } from '@/framework/concurrency'
import { type Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndicateurContribution } from '@/collection/resolveCollectionTauxProgression'
import { loadIndicateurDimensions } from '@/dimension/queries/loadIndicateurDimensions'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

// Aligné sur /indicateurs/:id/taux-progression : `month/month` est le défaut
// documenté. Pas exposé en query côté collection en v0.
const DATE_TRUNC_VALEUR = 'month' as const
const DATE_TRUNC_OBJECTIF = 'month' as const

type CollectionIndicateurRef = {
  ponderation: Decimal
  indicateur: { id: string; publicId: string }
}

// Membres d'une cellule demandée, avec leur dimension. Un membre inconnu lève
// P2025 (→ 404), comme le `findFirstOrThrow` historique sur l'individu.
export const loadMembresCellule = async (
  cellule: string,
): Promise<Array<{ publicId: string; dimensionId: string }>> => {
  const publicIds = parseCelluleId(cellule)
  const membres = await db().individu.findMany({
    where: { publicId: { in: publicIds } },
    select: { publicId: true, referentiel: { select: { dimensionId: true } } },
  })
  const connus = new Set(membres.map((m) => m.publicId))
  const inconnu = publicIds.find((publicId) => !connus.has(publicId))
  if (inconnu) await db().individu.findFirstOrThrow({ where: { publicId: inconnu } })
  return membres.map((m) => ({ publicId: m.publicId, dimensionId: m.referentiel.dimensionId }))
}

// Taux de progression de chaque indicateur d'une collection pour une cellule.
// Projection par indicateur (cf. dimensions-design.md « Collections ») : on ne
// garde que les coordonnées dont la dimension appartient à l'indicateur. Si la
// collection contient au moins un indicateur multi-dimension et qu'un indicateur
// ne porte aucune dimension de la cellule, il est « non applicable » (exclu de
// la moyenne) au lieu de rendre la collection null. Une collection purement
// mono-dimension garde la règle historique (cellule utilisée telle quelle).
export const computeContributions = async (
  indicateurs: CollectionIndicateurRef[],
  cellule: string,
): Promise<IndicateurContribution[]> => {
  const membres = await loadMembresCellule(cellule)
  const dimensionsParIndicateur = new Map(
    await Promise.all(
      indicateurs.map(
        async ({ indicateur }) =>
          [indicateur.id, await loadIndicateurDimensions(indicateur.id)] as const,
      ),
    ),
  )
  const collectionMultiDimension = [...dimensionsParIndicateur.values()].some(
    (dimensions) => dimensions.length > 1,
  )
  return withConcurrency(
    indicateurs.map(({ indicateur, ponderation }) => async () => {
      const dimensions = new Set(
        dimensionsParIndicateur.get(indicateur.id)!.map((dimension) => dimension.dimensionId),
      )
      const projetes = membres.filter((membre) => dimensions.has(membre.dimensionId))
      if (collectionMultiDimension && projetes.length === 0) {
        return {
          indicateurPublicId: indicateur.publicId,
          tauxProgression: null,
          date: null,
          ponderation,
          nonApplicable: true,
        }
      }
      const celluleProjetee = collectionMultiDimension
        ? projetes.map((membre) => membre.publicId).join('~')
        : cellule
      const dernier = await computeDernierTaux({
        indicateurId: indicateur.id,
        cellule: celluleProjetee,
      })
      return {
        indicateurPublicId: indicateur.publicId,
        tauxProgression: dernier?.tauxProgression ?? null,
        date: dernier?.date ?? null,
        ponderation,
      }
    }),
  )
}

// Sélectionne le dernier bucket parmi les points calculés par le pipeline
// taux-progression. La règle « tout-ou-rien » côté collection veut que tout
// indicateur dont l'un des prérequis manque (pas de série, pas d'objectif,
// dernier objectif à 0) produise `null` — ce qui correspond ici à l'absence
// de point ou à un dernier point sans taux.
const computeDernierTaux = async ({
  indicateurId,
  cellule,
}: {
  indicateurId: string
  cellule: string
}): Promise<{ tauxProgression: number | null; date: Bucket } | null> => {
  const points = await computeTauxProgressionPoints({
    indicateurId,
    cellules: [cellule],
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
