import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performSuppression = async (enfantPublicId: string): Promise<void> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )

  await db().relation.deleteMany({ where: { child: { publicId: enfantPublicId } } })
}

export const supprimerRelation = (enfantPublicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSuppression(enfantPublicId))
