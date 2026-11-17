import {
  type CollectionTauxProgressionApiModel,
  type CollectionTauxProgressionContributionApiModel,
  type GetCollectionTauxProgressionQuery,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { formatBucket } from '@/framework/bucket'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { withCollectionReadPermission } from '@/collection/permissions'
import { computeContributions } from '@/collection/queries/computeCollectionContributions'
import { resolveCollectionTauxProgression } from '@/collection/resolveCollectionTauxProgression'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

const collectionTauxProgressionArgs = {
  select: {
    id: true,
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true, sensSouhaite: true } },
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
      raisonSansTaux: 'COLLECTION_VIDE',
      contributions: [],
    }
  }

  // Individu inconnu → 404 via le handler global (mappe Prisma P2025).
  const cible: IndividuRef = await db().individu.findFirstOrThrow({
    where: { publicId: params.individu },
    select: { id: true, publicId: true, referentielId: true },
  })

  const contributions = await computeContributions(collection.indicateurs, cible)

  const { tauxProgression, raisonSansTaux } = resolveCollectionTauxProgression(contributions)

  const apiContributions: CollectionTauxProgressionContributionApiModel[] = contributions.map(
    (c) => ({
      indicateur: c.indicateurPublicId,
      tauxProgression: c.tauxProgression,
      date: c.date ? formatBucket(c.date) : null,
      ponderation: c.ponderation.toNumber(),
      sensSouhaite: c.sensSouhaite,
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
    raisonSansTaux,
    contributions: apiContributions,
  }
}
