import { type UpsertDimensionBody } from '@pilote/kpilote-shared/dimension'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

// Les dimensions sont de la configuration utilisateur : elles vivent en base et
// se gèrent par l'API (admin), jamais dans le code. Les niveaux se rattachent
// côté référentiel (`PUT /referentiels/{id}` avec `dimension`).
export const upsertDimension = (
  publicId: string,
  body: UpsertDimensionBody,
): ResultAsync<void, never> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )
  const description = body.description ?? null
  return ResultAsync.fromSafePromise(
    db().dimension.upsert({
      where: { publicId },
      update: { nom: body.nom, description },
      create: { id: uuidv7(), publicId, nom: body.nom, description },
    }),
  ).map(() => undefined)
}
