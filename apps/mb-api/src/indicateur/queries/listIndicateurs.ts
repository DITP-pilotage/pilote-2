import {
  type IndicateurApiModel,
  type IndicateurListApiModel,
  type IndicateurPublicId,
} from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { prisma } from '@/framework/persistence/prisma'

const PAGE_SIZE = 5

type ListIndicateursParams = {
  recherche?: string | undefined
  cursor?: IndicateurPublicId | undefined
}

type IndicateurRow = {
  publicId: string
  nom: string
  createdAt: Date
  updatedAt: Date
}

const toApiModel = (row: IndicateurRow): IndicateurApiModel => ({
  id: row.publicId,
  nom: row.nom,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const listIndicateurs = (
  params: ListIndicateursParams,
): ResultAsync<IndicateurListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = prisma.indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    take: PAGE_SIZE + 1,
    select: { publicId: true, nom: true, createdAt: true, updatedAt: true },
    ...(params.cursor && { cursor: { publicId: params.cursor }, skip: 1 }),
  })
  const fetchTotal = prisma.indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(
    ([rows, total]) => {
      const hasMore = rows.length > PAGE_SIZE
      const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(toApiModel)
      const nextCursor =
        hasMore && items.length > 0 ? items[items.length - 1]!.id : null

      return {
        items,
        pagination: { cursor: nextCursor, hasMore },
        total,
      }
    },
  )
}
