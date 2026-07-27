import { type IndividuListApiModel, type ListIndividusQuery } from '@pilote/kpilote-shared/individu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { individuInclude, toIndividuApiModel } from '@/individu/utils'

export const listIndividus = (
  params: ListIndividusQuery,
): ResultAsync<IndividuListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = db().individu.findMany({
    where,
    // `id` en second critère : le curseur de pagination se positionne dessus,
    // l'ordre doit donc rester total même quand deux individus sont homonymes.
    orderBy: [{ nom: 'asc' }, { id: 'asc' }],
    include: individuInclude,
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuApiModel, params.pageSize),
  )
}
