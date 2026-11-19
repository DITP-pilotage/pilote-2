import { type AddCollectionIndicateurBody } from '@pilote/kpilote-shared/collection'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type AddCollectionIndicateurError = { type: 'INDICATEUR_DEJA_AFFECTE' }

const performAdd = async (
  publicId: string,
  body: AddCollectionIndicateurBody,
): Promise<Result<void, AddCollectionIndicateurError>> => {
  ensureAdmin()

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: body.indicateurId },
    select: { id: true },
  })

  const existant = await db().collectionIndicateur.findUnique({
    where: {
      collectionId_indicateurId: { collectionId: collection.id, indicateurId: indicateur.id },
    },
  })
  if (existant) return err({ type: 'INDICATEUR_DEJA_AFFECTE' })

  await db().collectionIndicateur.create({
    data: {
      collectionId: collection.id,
      indicateurId: indicateur.id,
      ponderation: body.ponderation ?? 1,
    },
  })
  return ok()
}

export const addCollectionIndicateur = (
  publicId: string,
  body: AddCollectionIndicateurBody,
): ResultAsync<void, AddCollectionIndicateurError> => new ResultAsync(performAdd(publicId, body))
