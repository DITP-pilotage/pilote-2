import { type IndicateurApiModel, type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const upsertIndicateur = (
  body: UpsertIndicateurBody,
): ResultAsync<IndicateurApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.upsert({
      where: { publicId: body.publicId },
      update: { nom: body.nom },
      create: { id: uuidv7(), publicId: body.publicId, nom: body.nom },
    }),
  ).map(toIndicateurApiModel)
