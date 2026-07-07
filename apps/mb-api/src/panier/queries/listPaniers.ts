import { type ListPaniersQuery, type PanierListApiModel } from '@pilote/mb-shared/panier'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withPanierReadPermission } from '@/panier/permissions'
import { toPanierApiModel } from '@/panier/utils'

export const listPaniers = (params: ListPaniersQuery): ResultAsync<PanierListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.PanierWhereInput = {}
  if (params.recherche) {
    filters.nom = { contains: params.recherche, mode: 'insensitive' }
  }
  if (params.rechercheIdentifiant) {
    filters.publicId = { contains: params.rechercheIdentifiant, mode: 'insensitive' }
  }
  // Un principal ADMIN administre tous les paniers (PUBLIC + PRIVÉ), cohérent
  // avec isAdminPrincipal qui court-circuite déjà /me/permissions.
  const where = isAdminPrincipal() ? filters : withPanierReadPermission(filters, principalId)

  const fetchPage = db().panier.findMany({
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
  const fetchTotal = db().panier.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toPanierApiModel, params.pageSize),
  )
}
