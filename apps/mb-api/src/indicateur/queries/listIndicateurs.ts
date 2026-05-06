import { type IndicateurListApiModel, type ListIndicateursQuery } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const listIndicateurs = (
  params: ListIndicateursQuery,
): ResultAsync<IndicateurListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = db().indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    ...buildPaginationArgs(params.cursor),
  })
  const fetchTotal = db().indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndicateurApiModel),
  )
}
