import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// Suppression réelle (DELETE), possible uniquement depuis la corbeille. Le
// onDelete: Cascade de la self-relation supprime aussi les descendants.
const performSupprimer = async (id: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const article = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  if (article.statut !== 'CORBEILLE') {
    throw new ConflictError('L’article doit être en corbeille avant sa suppression définitive.')
  }
  await db().articleCentreAide.delete({ where: { id } })
}

export const supprimerArticleCentreAide = (id: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSupprimer(id))
