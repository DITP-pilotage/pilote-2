import {
  type CollectionTauxProgressionSummaryApiModel,
  type CollectionTauxProgressionSummaryListApiModel,
  type ListCollectionTauxProgressionQuery,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeContributions } from '@/collection/queries/computeCollectionContributions'
import { withCollectionReadPermission } from '@/collection/permissions'
import { resolveCollectionTauxProgression } from '@/collection/resolveCollectionTauxProgression'
import { resolveIndividusCibles } from '@/valeurAvancement/resolveIndividusCibles'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

const collectionListArgs = {
  select: {
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' as const },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true, sensSouhaite: true } },
      },
    },
  },
} satisfies Prisma.CollectionDefaultArgs

type CollectionRow = Prisma.CollectionGetPayload<typeof collectionListArgs>

type ListCollectionTauxProgressionParams = {
  query: ListCollectionTauxProgressionQuery
}

export const listCollectionTauxProgression = (
  params: ListCollectionTauxProgressionParams,
): ResultAsync<CollectionTauxProgressionSummaryListApiModel, never> =>
  ResultAsync.fromSafePromise(build(params))

const build = async ({
  query,
}: ListCollectionTauxProgressionParams): Promise<CollectionTauxProgressionSummaryListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const collections = await db().collection.findMany({
    where: withCollectionReadPermission({ publicId: { in: query.collections } }, principalId),
    ...collectionListArgs,
  })
  // Les racines se résolvent en une fois pour tous les indicateurs des collections.
  const individusCibles = await resolveIndividusCibles({
    selectedPublicIds: query.individus,
    indicateurIds: collections.flatMap((collection) =>
      collection.indicateurs.map(({ indicateur }) => indicateur.id),
    ),
  })

  const startedAt = performance.now()

  const items = await withConcurrency(
    collections.map((collection) => () => computeCollectionTaux({ collection, individusCibles })),
  )

  logger.info(
    {
      event: 'collection.listCollectionTauxProgression.timing',
      individus: query.individus ?? null,
      nbCollectionsDemandes: query.collections.length,
      nbCollectionsAccessibles: collections.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listCollectionTauxProgression computed',
  )

  return { items }
}

const computeCollectionTaux = async ({
  collection,
  individusCibles,
}: {
  collection: CollectionRow
  individusCibles: ReadonlyMap<string, IndividuRef>
}): Promise<CollectionTauxProgressionSummaryApiModel> => {
  const contributions = await computeContributions({
    indicateurs: collection.indicateurs,
    individuCibleOf: (indicateurId) => individusCibles.get(indicateurId),
  })
  const { tauxProgression, raisonSansTaux } = resolveCollectionTauxProgression(contributions)
  return { collection: collection.publicId, tauxProgression, raisonSansTaux }
}
