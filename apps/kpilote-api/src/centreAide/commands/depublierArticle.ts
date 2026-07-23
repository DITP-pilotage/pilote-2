import { type ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performDepublier = async (id: string): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const updated = await db().articleCentreAide.update({
    where: { id },
    data: { estPublie: false, updatedBy: principalId },
  })
  return toArticleCentreAideApiModel(updated)
}

export const depublierArticleCentreAide = (
  id: string,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performDepublier(id))
