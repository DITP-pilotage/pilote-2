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
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

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

type GetCollectionTauxProgressionParams = {
  collectionPublicId: string
  query: GetCollectionTauxProgressionQuery
}

const performGet = async ({
  collectionPublicId,
  query,
}: GetCollectionTauxProgressionParams): Promise<CollectionTauxProgressionApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const collection = await db().collection.findFirstOrThrow({
    where: withCollectionReadPermission({ publicId: collectionPublicId }, principalId),
    ...collectionTauxProgressionArgs,
  })
  return buildResult({ collection, query })
}

export const getCollectionTauxProgression = (
  params: GetCollectionTauxProgressionParams,
): ResultAsync<CollectionTauxProgressionApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(params))

const buildResult = async ({
  collection,
  query,
}: {
  collection: CollectionRow
  query: GetCollectionTauxProgressionQuery
}): Promise<CollectionTauxProgressionApiModel> => {
  const startedAt = performance.now()

  // Collection vide → result null, contributions vide.
  if (collection.indicateurs.length === 0) {
    return {
      collection: collection.publicId,
      individu: query.individu,
      tauxProgression: null,
      raisonSansTaux: 'COLLECTION_VIDE',
      contributions: [],
    }
  }

  // Individu inconnu → 404 via le handler global (mappe Prisma P2025).
  const individuCible: IndividuRef = await db().individu.findFirstOrThrow({
    where: { publicId: query.individu },
    select: { id: true, publicId: true, referentielId: true },
  })

  const contributions = await computeContributions({
    indicateurs: collection.indicateurs,
    individuCibleOf: () => individuCible,
  })

  const { tauxProgression, raisonSansTaux } = resolveCollectionTauxProgression(contributions)

  const apiContributions: CollectionTauxProgressionContributionApiModel[] = contributions.map(
    (contribution) => ({
      indicateur: contribution.indicateurPublicId,
      tauxProgression: contribution.tauxProgression,
      date: contribution.date ? formatBucket(contribution.date) : null,
      ponderation: contribution.ponderation.toNumber(),
      sensSouhaite: contribution.sensSouhaite,
    }),
  )

  logger.info(
    {
      event: 'collection.getCollectionTauxProgression.timing',
      collectionId: collection.id,
      individu: query.individu,
      nbIndicateurs: collection.indicateurs.length,
      tauxProgression,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'getCollectionTauxProgression computed',
  )

  return {
    collection: collection.publicId,
    individu: query.individu,
    tauxProgression,
    raisonSansTaux,
    contributions: apiContributions,
  }
}
