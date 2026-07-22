import {
  type CollectionTauxProgressionApiModel,
  type CollectionTauxProgressionContributionApiModel,
  type GetCollectionTauxProgressionQuery,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { ResultAsync } from 'neverthrow'

import { type DateTrunc } from '@pilote/kpilote-shared/dates'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { type Bucket, compareBuckets, formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { withCollectionReadPermission } from '@/collection/permissions'
import {
  type IndicateurContribution,
  resolveCollectionTauxProgression,
} from '@/collection/resolveCollectionTauxProgression'
import { computeTauxProgressionPoints } from '@/valeurAvancement/queries/computeTauxProgressionPoints'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'
import { type TauxProgressionPoint } from '@/valeurAvancement/resolveTauxProgression'

// Aligné sur la route /indicateurs/:id/taux-progression : `month/month` est
// le défaut documenté (cf. docs/architecture/taux-progression.md). Pas exposé
// en query côté collection en v0.
const DATE_TRUNC_VALEUR: DateTrunc = 'month'
const DATE_TRUNC_OBJECTIF: DateTrunc = 'month'

const collectionTauxProgressionArgs = {
  select: {
    id: true,
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true } },
      },
    },
  },
} satisfies Prisma.CollectionDefaultArgs

type CollectionRow = Prisma.CollectionGetPayload<typeof collectionTauxProgressionArgs>

export const getCollectionTauxProgression = (
  collectionPublicId: string,
  params: GetCollectionTauxProgressionQuery,
): ResultAsync<CollectionTauxProgressionApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().collection.findFirstOrThrow({
      where: withCollectionReadPermission({ publicId: collectionPublicId }, principalId),
      ...collectionTauxProgressionArgs,
    }),
  ).andThen((collection) => ResultAsync.fromSafePromise(buildResult({ collection, params })))
}

const buildResult = async ({
  collection,
  params,
}: {
  collection: CollectionRow
  params: GetCollectionTauxProgressionQuery
}): Promise<CollectionTauxProgressionApiModel> => {
  const startedAt = performance.now()

  // Collection vide → result null, contributions vide.
  if (collection.indicateurs.length === 0) {
    return {
      collection: collection.publicId,
      individu: params.individu,
      tauxProgression: null,
      contributions: [],
    }
  }

  // Individu inconnu → 404 via le handler global (mappe Prisma P2025).
  const cible: IndividuRef = await db().individu.findFirstOrThrow({
    where: { publicId: params.individu },
    select: { id: true, publicId: true, referentielId: true },
  })

  const contributions: IndicateurContribution[] = []
  for (const { indicateur: ind, ponderation } of collection.indicateurs) {
    const dernier = await computeDernierTaux({ indicateurId: ind.id, cible })
    contributions.push({
      indicateurPublicId: ind.publicId,
      tauxProgression: dernier?.tauxProgression ?? null,
      date: dernier?.date ?? null,
      ponderation,
    })
  }

  const { tauxProgression } = resolveCollectionTauxProgression(contributions)

  const apiContributions: CollectionTauxProgressionContributionApiModel[] = contributions.map(
    (c) => ({
      indicateur: c.indicateurPublicId,
      tauxProgression: c.tauxProgression,
      date: c.date ? formatBucket(c.date) : null,
      ponderation: c.ponderation.toNumber(),
    }),
  )

  logger.info(
    {
      event: 'collection.getCollectionTauxProgression.timing',
      collectionId: collection.id,
      individu: params.individu,
      nbIndicateurs: collection.indicateurs.length,
      tauxProgression,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'getCollectionTauxProgression computed',
  )

  return {
    collection: collection.publicId,
    individu: params.individu,
    tauxProgression,
    contributions: apiContributions,
  }
}

// Sélectionne le dernier bucket parmi les points calculés par le pipeline
// taux-progression. La règle « tout-ou-rien » côté collection veut que tout
// indicateur dont l'un des prérequis manque (pas de série, pas d'objectif,
// dernier objectif à 0) produise `null` — ce qui correspond ici à l'absence
// de point ou à un dernier point sans taux.
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
