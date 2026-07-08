import {
  type ListReferentielsQuery,
  type ReferentielListApiModel,
} from '@pilote/kpilot-shared/referentiel'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { toReferentielApiModel } from '@/referentiel/utils'

export const listReferentiels = (
  params: ListReferentielsQuery,
): ResultAsync<ReferentielListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = db().referentiel.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      _count: { select: { individus: true } },
      widgets: { include: { widget: true }, orderBy: { createdAt: 'asc' } },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().referentiel.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toReferentielApiModel, params.pageSize),
  )
}
