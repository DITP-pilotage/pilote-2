import { type DossierListApiModel, type ListDossiersQuery } from '@pilote/kpilote-shared/dossier'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withDossierReadPermission } from '@/dossier/permissions'
import { toDossierApiModel } from '@/dossier/utils'

export const listDossiers = (params: ListDossiersQuery): ResultAsync<DossierListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.DossierWhereInput = {}
  if (params.recherche) {
    filters.nom = { contains: params.recherche, mode: 'insensitive' }
  }
  if (params.rechercheIdentifiant) {
    filters.publicId = { contains: params.rechercheIdentifiant, mode: 'insensitive' }
  }
  // Un principal ADMIN administre tous les dossiers (PUBLIC + PRIVÉ), cohérent
  // avec isAdminPrincipal qui court-circuite déjà /me/permissions.
  const where = isAdminPrincipal() ? filters : withDossierReadPermission(filters, principalId)

  const fetchPage = db().dossier.findMany({
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
  const fetchTotal = db().dossier.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toDossierApiModel, params.pageSize),
  )
}
