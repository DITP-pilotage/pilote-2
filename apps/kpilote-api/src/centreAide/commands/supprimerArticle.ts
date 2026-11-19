import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type ArticleHorsCorbeilleError, checkArticleSupprimable } from '@/centreAide/rules'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type SupprimerArticleError = ArticleHorsCorbeilleError

// Suppression réelle (DELETE), possible uniquement depuis la corbeille. Le
// onDelete: Cascade de la self-relation supprime aussi les descendants.
const performSupprimer = async (id: string): Promise<Result<void, SupprimerArticleError>> => {
  ensureAdmin()
  const article = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })

  const supprimable = checkArticleSupprimable({ statut: article.statut })
  if (supprimable.isErr()) return err(supprimable.error)

  await db().articleCentreAide.delete({ where: { id } })
  return ok()
}

export const supprimerArticleCentreAide = (id: string): ResultAsync<void, SupprimerArticleError> =>
  new ResultAsync(performSupprimer(id))
