import {
  type ListPanierTauxProgressionForIndividuQuery,
  type PanierTauxProgressionSummaryListApiModel,
} from '@pilote/kpilote-shared/panierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Bucket, compareBuckets } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { withPanierReadPermission } from '@/panier/permissions'
import {
  type IndicateurContribution,
  resolvePanierTauxProgression,
} from '@/panier/resolvePanierTauxProgression'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

const DATE_TRUNC_VALEUR = 'month' as const
const DATE_TRUNC_OBJECTIF = 'month' as const

const panierListArgs = {
  select: {
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' as const },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true } },
      },
    },
  },
} satisfies Prisma.PanierDefaultArgs

type PanierRow = Prisma.PanierGetPayload<typeof panierListArgs>

export const listPanierTauxProgressionForIndividu = (
  individuPublicId: string,
  params: ListPanierTauxProgressionForIndividuQuery,
): ResultAsync<PanierTauxProgressionSummaryListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()

  return ResultAsync.fromSafePromise(
    db().individu.findFirstOrThrow({
      where: { publicId: individuPublicId },
      select: { id: true, publicId: true, referentielId: true },
    }),
  ).andThen((cible) =>
    ResultAsync.fromSafePromise(
      db().panier.findMany({
        where: withPanierReadPermission({ publicId: { in: params.paniers } }, principalId),
        ...panierListArgs,
      }),
    ).andThen((paniers) =>
      ResultAsync.fromSafePromise(
        Promise.all(paniers.map((panier) => computePanierTaux(panier, cible))),
      ).map((items) => ({ items })),
    ),
  )
}

const computePanierTaux = async (
  panier: PanierRow,
  cible: IndividuRef,
): Promise<{ panier: string; tauxProgression: number | null }> => {
  if (panier.indicateurs.length === 0) {
    return { panier: panier.publicId, tauxProgression: null }
  }

  const contributions: IndicateurContribution[] = await Promise.all(
    panier.indicateurs.map(async ({ indicateur, ponderation }) => {
      const dernier = await computeDernierTaux({ indicateurId: indicateur.id, cible })
      return {
        indicateurPublicId: indicateur.publicId,
        tauxProgression: dernier?.tauxProgression ?? null,
        date: dernier?.date ?? null,
        ponderation,
      }
    }),
  )

  const { tauxProgression } = resolvePanierTauxProgression(contributions)
  return { panier: panier.publicId, tauxProgression }
}

const computeDernierTaux = async ({
  indicateurId,
  cible,
}: {
  indicateurId: string
  cible: IndividuRef
}): Promise<{ tauxProgression: number | null; date: Bucket } | null> => {
  const points = await computeTauxProgressionPoints({
    indicateurId,
    individusCibles: [cible],
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
