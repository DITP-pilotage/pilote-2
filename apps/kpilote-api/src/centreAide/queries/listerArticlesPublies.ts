import { type ArticleCentreAidePublicListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { toArticleCentreAidePublicApiModel } from '@/centreAide/utils'
import { db } from '@/framework/persistence/dbStore'

// Lecture publique (tout principal authentifié). Règle d'affichage :
// - une PAGE apparaît si elle est publiée et non masquée ;
// - un GROUPE n'a pas d'état publié : il apparaît uniquement s'il est l'ancêtre
//   (non masqué) d'au moins une page publiée. Un groupe vide reste invisible.
const performListerPublies = async (): Promise<ArticleCentreAidePublicListApiModel> => {
  const articles = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF', estMasque: false },
    orderBy: [{ parentId: 'asc' }, { ordre: 'asc' }],
  })

  const parId = new Map(articles.map((article) => [article.id, article]))
  const pagesPubliees = articles.filter((article) => article.type === 'PAGE' && article.estPublie)

  const groupesAGarder = new Set<string>()
  for (const page of pagesPubliees) {
    let parentId = page.parentId
    while (parentId) {
      const parent = parId.get(parentId)
      if (!parent) break
      if (parent.type === 'GROUPE') groupesAGarder.add(parent.id)
      parentId = parent.parentId
    }
  }

  return articles
    .filter(
      (article) =>
        (article.type === 'PAGE' && article.estPublie) ||
        (article.type === 'GROUPE' && groupesAGarder.has(article.id)),
    )
    .map(toArticleCentreAidePublicApiModel)
}

export const listerArticlesCentreAidePublies = (): ResultAsync<
  ArticleCentreAidePublicListApiModel,
  never
> => ResultAsync.fromSafePromise(performListerPublies())
