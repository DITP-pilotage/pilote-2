import { type UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toUtilisateurApiModel } from '@/utilisateur/utils'

const performGet = async (id: string): Promise<UtilisateurApiModel> => {
  ensureAdmin()
  const row = await db().utilisateur.findUniqueOrThrow({
    where: { id },
    include: { identites: true },
  })
  return toUtilisateurApiModel(row)
}

export const getUtilisateurById = (id: string): ResultAsync<UtilisateurApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
