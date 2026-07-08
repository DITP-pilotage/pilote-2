import { type UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performGet = async (id: string): Promise<UtilisateurApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().utilisateur.findUniqueOrThrow({
    where: { id },
    include: { identites: true },
  })
  return toUtilisateurApiModel(row)
}

export const getUtilisateurById = (id: string): ResultAsync<UtilisateurApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
