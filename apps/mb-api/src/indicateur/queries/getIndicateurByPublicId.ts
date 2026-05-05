import { type IndicateurApiModel } from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const getIndicateurByPublicId = (publicId: string): ResultAsync<IndicateurApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().indicateur.findUniqueOrThrow({ where: { publicId } }),
  ).map(toIndicateurApiModel)
