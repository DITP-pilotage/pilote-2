import { type ArticleCentreAideListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performLister = async (): Promise<ArticleCentreAideListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const rows = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF' },
    orderBy: [{ parentId: 'asc' }, { ordre: 'asc' }],
  })
  return rows.map(toArticleCentreAideApiModel)
}

export const listerArticlesCentreAide = (): ResultAsync<ArticleCentreAideListApiModel, never> =>
  ResultAsync.fromSafePromise(performLister())
