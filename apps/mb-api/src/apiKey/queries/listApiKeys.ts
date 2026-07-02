import { type ApiKeyListApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { db } from '@/framework/persistence/dbStore'

// Pas de `new Date()` ici (interdit dans queries/) : `toApiKeyApiModel` lit
// l'horloge via son défaut interne (dans utils.ts, chemin autorisé). L'écart
// de quelques microsecondes entre lignes est sans effet sur active/expired/revoked.
export const listApiKeys = (): ResultAsync<ApiKeyListApiModel, never> =>
  ResultAsync.fromSafePromise(db().apiKey.findMany({ orderBy: { createdAt: 'desc' } })).map(
    (rows) => rows.map((row) => toApiKeyApiModel(row)),
  )
