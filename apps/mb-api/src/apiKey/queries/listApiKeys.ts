import { type ApiKeyListApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

// Garde ADMIN comme les commandes : les 3 endpoints de gestion des clés sont
// réservés aux clés API ADMIN. Pas de `new Date()` ici (interdit dans queries/) :
// `toApiKeyApiModel` lit l'horloge via son défaut interne (dans utils.ts, chemin
// autorisé) ; l'écart de quelques microsecondes entre lignes est sans effet.
const performList = async (): Promise<ApiKeyListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const rows = await db().apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((row) => toApiKeyApiModel(row))
}

export const listApiKeys = (): ResultAsync<ApiKeyListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
