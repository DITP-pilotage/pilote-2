import { type ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { htmlToPlainText, MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performPublier = async (id: string): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const article = await db().articleCentreAide.findUniqueOrThrow({ where: { id } })
  const updated = await db().articleCentreAide.update({
    where: { id },
    data: {
      titre: article.titreBrouillon,
      titreAffiche: article.titreAfficheBrouillon,
      contenu: article.contenuBrouillon,
      contenuTexte: htmlToPlainText(article.contenuBrouillon),
      estPublie: true,
      updatedBy: principalId,
    },
  })
  return toArticleCentreAideApiModel(updated)
}

export const publierArticleCentreAide = (
  id: string,
): ResultAsync<ArticleCentreAideApiModel, never> => ResultAsync.fromSafePromise(performPublier(id))
