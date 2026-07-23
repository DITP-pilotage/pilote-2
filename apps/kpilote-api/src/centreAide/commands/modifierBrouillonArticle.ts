import {
  type ArticleCentreAideApiModel,
  type ModifierBrouillonArticleBody,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performModifier = async (
  id: string,
  body: ModifierBrouillonArticleBody,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const updated = await db().articleCentreAide.update({
    where: { id },
    data: {
      ...(body.titreBrouillon !== undefined ? { titreBrouillon: body.titreBrouillon } : {}),
      ...(body.titreAfficheBrouillon !== undefined
        ? { titreAfficheBrouillon: body.titreAfficheBrouillon }
        : {}),
      ...(body.contenuBrouillon !== undefined ? { contenuBrouillon: body.contenuBrouillon } : {}),
      updatedBy: principalId,
    },
  })
  return toArticleCentreAideApiModel(updated)
}

export const modifierBrouillonArticleCentreAide = (
  id: string,
  body: ModifierBrouillonArticleBody,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performModifier(id, body))
