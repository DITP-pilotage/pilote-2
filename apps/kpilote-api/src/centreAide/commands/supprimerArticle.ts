import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type SupprimerArticleError = { type: 'ARTICLE_HORS_CORBEILLE' }

// Suppression réelle (DELETE), possible uniquement depuis la corbeille. Le
// onDelete: Cascade de la self-relation supprime aussi les descendants.
const performSupprimer = async (id: string): Promise<Result<void, SupprimerArticleError>> => {
  ensureAdmin()
  const article = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  if (article.statut !== 'CORBEILLE') return err({ type: 'ARTICLE_HORS_CORBEILLE' })
  await db().articleCentreAide.delete({ where: { id } })
  return ok()
}

export const supprimerArticleCentreAide = (id: string): ResultAsync<void, SupprimerArticleError> =>
  new ResultAsync(performSupprimer(id))
