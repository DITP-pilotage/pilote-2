import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { ResultAsync } from 'neverthrow'

import { modaliteInclude, toModaliteApiModel } from '@/axe/utils'
import { db } from '@/framework/persistence/dbStore'

// Modalité inconnue : `findUniqueOrThrow` lève P2025, converti en 404 par le gestionnaire d'erreurs.
export const getModaliteByPublicId = ({
  publicId,
}: {
  publicId: string
}): ResultAsync<ModaliteApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().modalite.findUniqueOrThrow({ where: { publicId }, include: modaliteInclude }),
  ).map(toModaliteApiModel)
