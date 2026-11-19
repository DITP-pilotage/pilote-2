import { type UpdateCollectionIndicateurPonderationBody } from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performUpdate = async (
  publicId: string,
  indicateurPublicId: string,
  body: UpdateCollectionIndicateurPonderationBody,
): Promise<void> => {
  ensureAdmin()

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: indicateurPublicId },
    select: { id: true },
  })

  // `update` et non `upsert` : un lien absent doit remonter en 404, pas créer
  // une affectation silencieuse.
  await db().collectionIndicateur.update({
    where: {
      collectionId_indicateurId: { collectionId: collection.id, indicateurId: indicateur.id },
    },
    data: { ponderation: body.ponderation },
  })
}

export const updateCollectionIndicateurPonderation = (
  publicId: string,
  indicateurPublicId: string,
  body: UpdateCollectionIndicateurPonderationBody,
): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performUpdate(publicId, indicateurPublicId, body))
