import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performSupprimer = async (id: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  // Le onDelete: Cascade de la self-relation supprime aussi les descendants.
  await db().articleCentreAide.delete({ where: { id } })
}

export const supprimerArticleCentreAide = (id: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSupprimer(id))
