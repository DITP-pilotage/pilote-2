import { type ArticleCentreAidePublicListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { toArticleCentreAidePublicApiModel } from '@/centreAide/utils'
import { db } from '@/framework/persistence/dbStore'

// Lecture publique (tout principal authentifié) : uniquement le publié & non masqué,
// et jamais les champs brouillon (cf. toArticleCentreAidePublicApiModel).
const performListerPublies = async (): Promise<ArticleCentreAidePublicListApiModel> => {
  const rows = await db().articleCentreAide.findMany({
    where: { estPublie: true, estMasque: false },
    orderBy: [{ parentId: 'asc' }, { ordre: 'asc' }],
  })
  return rows.map(toArticleCentreAidePublicApiModel)
}

export const listerArticlesCentreAidePublies = (): ResultAsync<
  ArticleCentreAidePublicListApiModel,
  never
> => ResultAsync.fromSafePromise(performListerPublies())
