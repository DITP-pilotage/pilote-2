import {
  type IndividuListApiModel,
  type ListIndividusForReferentielQuery,
} from '@pilote/mb-shared/individu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { toIndividuApiModel } from '@/individu/utils'

export const listIndividusForReferentiel = (
  referentielPublicId: string,
  params: ListIndividusForReferentielQuery,
): ResultAsync<IndividuListApiModel, never> => {
  const where = {
    referentiels: { some: { referentiel: { publicId: referentielPublicId } } },
    ...(params.recherche
      ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
      : {}),
  }

  const fetchPage = db().individu.findMany({
    where,
    orderBy: { id: 'asc' },
    include: { referentiels: { include: { referentiel: true } } },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuApiModel, params.pageSize),
  )
}
