import { type AxeApiModel } from '@pilote/kpilote-shared/axe'
import { ResultAsync } from 'neverthrow'

import { axeInclude, toAxeApiModel } from '@/axe/utils'
import { db } from '@/framework/persistence/dbStore'

// Axe inconnu : `findUniqueOrThrow` lève P2025, converti en 404 par le gestionnaire d'erreurs.
export const getAxeByPublicId = ({
  publicId,
}: {
  publicId: string
}): ResultAsync<AxeApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().axe.findUniqueOrThrow({ where: { publicId }, include: axeInclude }),
  ).map(toAxeApiModel)
