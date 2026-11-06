import {
  type CollectionTauxProgressionSummaryListApiModel,
  type ListCollectionTauxProgressionForIndividuQuery,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import {
  computeContributions,
  loadMembresCellule,
} from '@/collection/queries/computeCollectionContributions'
import { withCollectionReadPermission } from '@/collection/permissions'
import { resolveCollectionTauxProgression } from '@/collection/resolveCollectionTauxProgression'

const collectionListArgs = {
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
} satisfies Prisma.CollectionDefaultArgs

type CollectionRow = Prisma.CollectionGetPayload<typeof collectionListArgs>

export const listCollectionTauxProgressionForIndividu = (
  individuPublicId: string,
  params: ListCollectionTauxProgressionForIndividuQuery,
): ResultAsync<CollectionTauxProgressionSummaryListApiModel, never> =>
  ResultAsync.fromSafePromise(build(individuPublicId, params))

const build = async (
  individuPublicId: string,
  params: ListCollectionTauxProgressionForIndividuQuery,
): Promise<CollectionTauxProgressionSummaryListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  // Membre inconnu → 404 (P2025), comme le findFirstOrThrow historique.
  await loadMembresCellule(individuPublicId)

  const startedAt = performance.now()

  const collections = await db().collection.findMany({
    where: withCollectionReadPermission({ publicId: { in: params.collections } }, principalId),
    ...collectionListArgs,
  })

  const items = await withConcurrency(
    collections.map((collection) => () => computeCollectionTaux(collection, individuPublicId)),
  )

  logger.info(
    {
      event: 'collection.listCollectionTauxProgressionForIndividu.timing',
      cellule: individuPublicId,
      nbCollectionsDemandes: params.collections.length,
      nbCollectionsAccessibles: collections.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listCollectionTauxProgressionForIndividu computed',
  )

  return { items }
}

const computeCollectionTaux = async (
  collection: CollectionRow,
  cellule: string,
): Promise<{ collection: string; tauxProgression: number | null }> => {
  if (collection.indicateurs.length === 0) {
    return { collection: collection.publicId, tauxProgression: null }
  }

  const contributions = await computeContributions(collection.indicateurs, cellule)
  const { tauxProgression } = resolveCollectionTauxProgression(contributions)
  return { collection: collection.publicId, tauxProgression }
}
