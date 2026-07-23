import { type ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGet = async (id: string): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const row = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  return toArticleCentreAideApiModel(row)
}

export const getArticleCentreAideById = (
  id: string,
): ResultAsync<ArticleCentreAideApiModel, never> => ResultAsync.fromSafePromise(performGet(id))
