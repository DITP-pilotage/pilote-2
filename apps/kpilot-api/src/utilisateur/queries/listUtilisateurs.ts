import {
  type ListUtilisateursQuery,
  type UtilisateurListApiModel,
} from '@pilote/kpilot-shared/utilisateur'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const buildWhere = (recherche: string | undefined): Prisma.UtilisateurWhereInput => {
  if (!recherche) return {}
  const contains = { contains: recherche, mode: 'insensitive' as const }
  return { OR: [{ email: contains }, { nom: contains }, { prenom: contains }] }
}

const performList = async (params: ListUtilisateursQuery): Promise<UtilisateurListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  const where = buildWhere(params.recherche)
  const [rows, total] = await Promise.all([
    db().utilisateur.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { identites: true },
      ...buildPaginationArgs(params.cursor, params.pageSize),
    }),
    db().utilisateur.count({ where }),
  ])

  return toPaginatedResponse(rows, total, toUtilisateurApiModel, params.pageSize)
}

export const listUtilisateurs = (
  params: ListUtilisateursQuery,
): ResultAsync<UtilisateurListApiModel, never> => ResultAsync.fromSafePromise(performList(params))
