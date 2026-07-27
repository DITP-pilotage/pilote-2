import { type ArticleCentreAidePublicListApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { toArticleCentreAidePublicApiModel } from '@/centreAide/utils'
import { db } from '@/framework/persistence/dbStore'

// Lecture publique (tout principal authentifié). Règle d'affichage :
// - une PAGE apparaît si elle est publiée, non masquée, et que toute sa chaîne
//   d'ancêtres est visible (un ancêtre masqué la rendrait orpheline dans l'arbo) ;
// - un GROUPE n'a pas d'état publié : il apparaît uniquement s'il est l'ancêtre
//   (non masqué) d'au moins une page affichée. Un groupe vide reste invisible.
const performListerPublies = async (): Promise<ArticleCentreAidePublicListApiModel> => {
  const articles = await db().articleCentreAide.findMany({
    where: { statut: 'ACTIF', estMasque: false },
    orderBy: [{ parentId: 'asc' }, { ordre: 'asc' }],
  })

  const parId = new Map(articles.map((article) => [article.id, article]))

  // Une chaîne d'ancêtres est complète si chaque parent jusqu'à la racine est
  // présent (donc non masqué). Un maillon manquant = ancêtre masqué → page exclue.
  const chaineComplete = (parentId: string | null): boolean => {
    for (let courant = parentId; courant; courant = parId.get(courant)?.parentId ?? null) {
      if (!parId.has(courant)) return false
    }
    return true
  }

  const pagesAffichees = articles.filter(
    (article) => article.type === 'PAGE' && article.estPublie && chaineComplete(article.parentId),
  )

  const groupesAGarder = new Set<string>()
  for (const page of pagesAffichees) {
    for (let courant = page.parentId; courant; courant = parId.get(courant)?.parentId ?? null) {
      groupesAGarder.add(courant)
    }
  }

  const pagesIds = new Set(pagesAffichees.map((page) => page.id))
  return articles
    .filter(
      (article) =>
        (article.type === 'PAGE' && pagesIds.has(article.id)) ||
        (article.type === 'GROUPE' && groupesAGarder.has(article.id)),
    )
    .map(toArticleCentreAidePublicApiModel)
}

export const listerArticlesCentreAidePublies = (): ResultAsync<
  ArticleCentreAidePublicListApiModel,
  never
> => ResultAsync.fromSafePromise(performListerPublies())
