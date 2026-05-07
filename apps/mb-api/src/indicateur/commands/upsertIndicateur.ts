import { type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'

export const upsertIndicateur = (
  publicId: string,
  body: UpsertIndicateurBody,
): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .indicateur.upsert({
        where: { publicId },
        update: { nom: body.nom },
        create: { id: uuidv7(), publicId, nom: body.nom },
      })
      .then(() => undefined),
  )
