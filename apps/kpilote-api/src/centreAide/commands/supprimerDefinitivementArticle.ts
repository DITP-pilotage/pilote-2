import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

// Suppression définitive (hard delete) depuis la corbeille. Le onDelete: Cascade
// de la self-relation supprime aussi les descendants.
const performSupprimerDefinitivement = async (id: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  await db().articleCentreAide.delete({ where: { id } })
}

export const supprimerDefinitivementArticleCentreAide = (id: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSupprimerDefinitivement(id))
