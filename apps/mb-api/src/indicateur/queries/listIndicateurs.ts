import {
  type IndicateurListApiModel,
  type ListIndicateursQuery,
} from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const listIndicateurs = (
  params: ListIndicateursQuery,
): ResultAsync<IndicateurListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where = withIndicateurReadPermission(
    params.recherche ? { nom: { contains: params.recherche, mode: 'insensitive' } } : {},
    principalId,
  )

  const fetchPage = db().indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      referentiels: {
        select: {
          fonctionAgregation: true,
          referentiel: { select: { publicId: true } },
        },
      },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndicateurApiModel, params.pageSize),
  )
}
