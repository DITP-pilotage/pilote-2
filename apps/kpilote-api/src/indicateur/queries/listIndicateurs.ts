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

  const loadPage = async (): Promise<IndicateurListApiModel> => {
    const [rows, total] = await Promise.all([fetchPage, fetchTotal])
    // Une seule requête pour toutes les dernières valeurs de la page (évite le N+1).
    // La date est en `YYYY-MM-DD` : MAX lexicographique = MAX chronologique.
    const maxDates = await db().valeurAvancement.groupBy({
      by: ['indicateurId'],
      where: { indicateurId: { in: rows.map((row) => row.id) } },
      _max: { date: true },
    })
    const dateParIndicateur = new Map(maxDates.map((m) => [m.indicateurId, m._max.date]))
    return toPaginatedResponse(
      rows,
      total,
      (row) =>
        toIndicateurApiModel({
          indicateur: row,
          dateDerniereValeur: dateParIndicateur.get(row.id) ?? null,
        }),
      params.pageSize,
    )
  }

  return ResultAsync.fromSafePromise(loadPage())
}
