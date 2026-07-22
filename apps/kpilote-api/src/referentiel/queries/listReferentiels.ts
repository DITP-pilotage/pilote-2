import {
  type ListReferentielsQuery,
  type ReferentielListApiModel,
} from '@pilote/kpilote-shared/referentiel'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toReferentielApiModel } from '@/referentiel/utils'

const PANIER_SCOPE_PREFIX = 'panier:'

// Restreint aux référentiels reliés à ≥1 indicateur pertinent selon le scope :
// `me` = indicateurs lisibles par le principal, `panier:<publicId>` = indicateurs
// du panier (toujours filtrés par lisibilité). Le concept d'« ensemble » n'est pas
// matérialisé : la hiérarchie est reconstruite côté front via les individus.
const buildScopeFilter = (
  scope: ListReferentielsQuery['scope'],
): Prisma.ReferentielWhereInput => {
  if (!scope) return {}
  const principalId = requireCurrentPrincipalId()
  const isAdmin = isAdminPrincipal()
  const base: Prisma.IndicateurWhereInput = scope.startsWith(PANIER_SCOPE_PREFIX)
    ? { paniers: { some: { panier: { publicId: scope.slice(PANIER_SCOPE_PREFIX.length) } } } }
    : {}
  const indicateurWhere = withIndicateurReadPermission(base, principalId, { isAdmin })
  return { indicateurs: { some: { indicateur: indicateurWhere } } }
}

export const listReferentiels = (
  params: ListReferentielsQuery,
): ResultAsync<ReferentielListApiModel, never> => {
  const where: Prisma.ReferentielWhereInput = {
    ...(params.recherche
      ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
      : {}),
    ...buildScopeFilter(params.scope),
  }

  const fetchPage = db().referentiel.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      _count: { select: { individus: true } },
      widgets: { include: { widget: true }, orderBy: { createdAt: 'asc' } },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().referentiel.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toReferentielApiModel, params.pageSize),
  )
}
