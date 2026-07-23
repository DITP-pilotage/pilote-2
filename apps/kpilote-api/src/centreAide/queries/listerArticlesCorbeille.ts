import { type ArticleCentreAideListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performListerCorbeille = async (): Promise<ArticleCentreAideListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const rows = await db().articleCentreAide.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
  })
  return rows.map(toArticleCentreAideApiModel)
}

export const listerArticlesCentreAideCorbeille = (): ResultAsync<
  ArticleCentreAideListApiModel,
  never
> => ResultAsync.fromSafePromise(performListerCorbeille())
