import { type ListRelationsQuery, type RelationListApiModel } from '@pilote/kpilote-shared/relation'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { relationInclude, toRelationApiModel } from '@/relation/utils'

export const listRelations = (
  params: ListRelationsQuery,
): ResultAsync<RelationListApiModel, never> => {
  const where = params.recherche
    ? { child: { nom: { contains: params.recherche, mode: 'insensitive' as const } } }
    : {}

  const fetchPage = db().relation.findMany({
    where,
    // `id` en second critère : le curseur de pagination se positionne dessus,
    // l'ordre doit donc rester total même quand deux enfants sont homonymes.
    orderBy: [{ child: { nom: 'asc' } }, { id: 'asc' }],
    include: relationInclude,
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().relation.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toRelationApiModel, params.pageSize),
  )
}
