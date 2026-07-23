import {
  type ArticleCentreAideApiModel,
  type BasculerVisibiliteArticleBody,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performBasculer = async (
  id: string,
  body: BasculerVisibiliteArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const updated = await db().articleCentreAide.update({
    where: { id },
    data: { estMasque: body.estMasque, updatedBy: principalId },
  })
  return toArticleCentreAideApiModel(updated)
}

export const basculerVisibiliteArticleCentreAide = (
  id: string,
  body: BasculerVisibiliteArticleBody,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performBasculer(id, body))
