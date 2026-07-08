import {
  type IndicateurListApiModel,
  type ListIndicateursQuery,
} from '@pilote/kpilote-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const listIndicateurs = (
  params: ListIndicateursQuery,
): ResultAsync<IndicateurListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.IndicateurWhereInput = {}
  if (params.recherche) {
    filters.nom = { contains: params.recherche, mode: 'insensitive' }
  }
  if (params.rechercheIdentifiant) {
    filters.publicId = { contains: params.rechercheIdentifiant, mode: 'insensitive' }
  }
  if (params.ids && params.ids.length > 0) {
    filters.publicId = { in: params.ids }
  }
  // Le bypass ADMIN (administre PUBLIC + PRIVÉ) est géré dans withIndicateurReadPermission.
  const where = withIndicateurReadPermission(filters, principalId, {
    isAdmin: isAdminPrincipal(),
  })

  const fetchPage = db().indicateur.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      referentiels: { include: { referentiel: true } },
      responsables: {
        orderBy: { createdAt: 'asc' },
        include: { utilisateur: true },
      },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().indicateur.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndicateurApiModel, params.pageSize),
  )
}
