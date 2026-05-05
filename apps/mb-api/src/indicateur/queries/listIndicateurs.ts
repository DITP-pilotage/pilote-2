import { type IndicateurListApiModel, type ListIndicateursQuery } from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toIndicateurApiModel } from '@/indicateur/utils'

const PAGE_SIZE = 5

export const listIndicateurs = (
  params: ListIndicateursQuery,
): ResultAsync<IndicateurListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = db().indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    take: PAGE_SIZE + 1,
    ...(params.cursor && { cursor: { publicId: params.cursor }, skip: 1 }),
  })
  const fetchTotal = db().indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) => {
    const hasMore = rows.length > PAGE_SIZE
    const items = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map(toIndicateurApiModel)
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null

    return {
      items,
      pagination: { cursor: nextCursor, hasMore },
      total,
    }
  })
}
