import { type ListPaniersQuery, type PanierListApiModel } from '@pilote/mb-shared/panier'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { withPanierReadPermission } from '@/panier/permissions'
import { toPanierApiModel } from '@/panier/utils'

export const listPaniers = (params: ListPaniersQuery): ResultAsync<PanierListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where = withPanierReadPermission({}, principalId)

  const fetchPage = db().panier.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      indicateurs: {
        orderBy: { createdAt: 'asc' },
        include: { indicateur: { select: { publicId: true } } },
      },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().panier.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toPanierApiModel, params.pageSize),
  )
}
