import {
  type ArticleCentreAideApiModel,
  type CreerArticleCentreAideBody,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const performCreer = async (
  body: CreerArticleCentreAideBody,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()
  const parentId = body.parentId ?? null

  const agregat = await db().articleCentreAide.aggregate({
    where: { parentId },
    _max: { ordre: true },
  })
  const ordre = (agregat._max.ordre ?? -1) + 1

  const created = await db().articleCentreAide.create({
    data: {
      id: uuidv7(),
      type: body.type,
      parentId,
      ordre,
      titreBrouillon: body.titre,
      titreAfficheBrouillon: body.titre,
      createdBy: principalId,
      updatedBy: principalId,
    },
  })
  return toArticleCentreAideApiModel(created)
}

export const creerArticleCentreAide = (
  body: CreerArticleCentreAideBody,
): ResultAsync<ArticleCentreAideApiModel, never> => ResultAsync.fromSafePromise(performCreer(body))
