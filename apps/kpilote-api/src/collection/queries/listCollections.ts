import {
  type CollectionListApiModel,
  type ListCollectionsQuery,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withCollectionReadPermission } from '@/collection/permissions'
import { toCollectionApiModel } from '@/collection/utils'

export const listCollections = (
  params: ListCollectionsQuery,
): ResultAsync<CollectionListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.CollectionWhereInput = {}
  if (params.recherche) {
    filters.nom = { contains: params.recherche, mode: 'insensitive' }
  }
  if (params.rechercheIdentifiant) {
    filters.publicId = { contains: params.rechercheIdentifiant, mode: 'insensitive' }
  }
  if (params.ids && params.ids.length > 0) {
    filters.publicId = { in: params.ids }
  }
  // Un principal ADMIN administre toutes les collections (PUBLIC + PRIVÉ), cohérent
  // avec isAdminPrincipal qui court-circuite déjà /me/permissions.
  const where = isAdminPrincipal() ? filters : withCollectionReadPermission(filters, principalId)

  const fetchPage = db().collection.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      indicateurs: {
        orderBy: { createdAt: 'asc' },
        include: { indicateur: { select: { publicId: true } } },
      },
      responsables: {
        orderBy: { createdAt: 'asc' },
        include: { utilisateur: true },
      },
      contactsUtiles: {
        include: { contactUtile: { include: { organisme: true } } },
      },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().collection.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toCollectionApiModel, params.pageSize),
  )
}
