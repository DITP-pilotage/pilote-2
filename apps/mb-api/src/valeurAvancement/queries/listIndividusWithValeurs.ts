import {
  type IndividusWithValeursListApiModel,
  type ListIndividusWithValeursQuery,
} from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { toIndividuAvecValeursApiModel } from '@/valeurAvancement/utils'

export const listIndividusWithValeurs = (
  indicateurPublicId: string,
  params: ListIndividusWithValeursQuery,
): ResultAsync<IndividusWithValeursListApiModel, never> => {
  const indicateurFilter = { indicateur: { publicId: indicateurPublicId } }
  const where = {
    valeurs: { some: indicateurFilter },
    ...(params.referentiel
      ? { referentiels: { some: { referentiel: { publicId: params.referentiel } } } }
      : {}),
  }

  const fetchPage = db().individu.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      referentiels: { include: { referentiel: true } },
      valeurs: {
        where: indicateurFilter,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: 1,
      },
      _count: { select: { valeurs: { where: indicateurFilter } } },
    },
    ...buildPaginationArgs(params.cursor, 'publicId'),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuAvecValeursApiModel),
  )
}
