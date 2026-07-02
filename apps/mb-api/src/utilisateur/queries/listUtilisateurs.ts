import { type UtilisateurListApiModel } from '@pilote/mb-shared/utilisateur'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performList = async (): Promise<UtilisateurListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const rows = await db().utilisateur.findMany({
    include: { identites: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((row) => toUtilisateurApiModel(row))
}

export const listUtilisateurs = (): ResultAsync<UtilisateurListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
