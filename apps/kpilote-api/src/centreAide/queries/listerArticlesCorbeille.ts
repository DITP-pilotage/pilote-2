import { type ArticleCentreAideListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performListerCorbeille = async (): Promise<ArticleCentreAideListApiModel> => {
  ensureAdmin()
  const rows = await db().articleCentreAide.findMany({
    where: { statut: 'CORBEILLE' },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(toArticleCentreAideApiModel)
}

export const listerArticlesCentreAideCorbeille = (): ResultAsync<
  ArticleCentreAideListApiModel,
  never
> => ResultAsync.fromSafePromise(performListerCorbeille())
