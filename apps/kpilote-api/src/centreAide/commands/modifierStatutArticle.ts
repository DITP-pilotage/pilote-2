import {
  type ArticleCentreAideApiModel,
  type ArticleCentreAideStatut,
} from '@pilote/kpilote-shared/centreAide'
import { ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN, toArticleCentreAideApiModel } from '@/centreAide/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

// Transition de cycle de vie : CORBEILLE = mettre à la corbeille, ACTIF = restaurer.
// La suppression réelle passe par `supprimerArticleCentreAide` (DELETE).
const performModifierStatut = async (
  id: string,
  statut: ArticleCentreAideStatut,
): Promise<ArticleCentreAideApiModel> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)
  const principalId = requireCurrentPrincipalId()

  const updated = await db().articleCentreAide.update({
    where: { id },
    data: { statut, updatedBy: principalId },
  })
  return toArticleCentreAideApiModel(updated)
}

export const modifierStatutArticleCentreAide = (
  id: string,
  statut: ArticleCentreAideStatut,
): ResultAsync<ArticleCentreAideApiModel, never> =>
  ResultAsync.fromSafePromise(performModifierStatut(id, statut))
