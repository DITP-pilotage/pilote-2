import {
  type IndicateurListApiModel,
  type ListIndicateursQuery,
} from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { PermissionAction } from '@/generated/prisma/enums'
import { toIndicateurApiModel } from '@/indicateur/utils'

const READ_ACTIONS: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

export const listIndicateurs = (
  params: ListIndicateursQuery,
): ResultAsync<IndicateurListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const where = {
    permissions: { some: { principalId, action: { in: READ_ACTIONS } } },
    ...(params.recherche
      ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
      : {}),
  }

  const fetchPage = db().indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndicateurApiModel, params.pageSize),
  )
}
