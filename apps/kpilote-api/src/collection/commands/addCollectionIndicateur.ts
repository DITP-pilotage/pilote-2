import {
  type AddCollectionIndicateurBody,
  type CollectionApiModel,
} from '@pilote/kpilote-shared/collection'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

export type AddCollectionIndicateurError = { type: 'INDICATEUR_DEJA_AFFECTE' }

const performAdd = async (
  publicId: string,
  body: AddCollectionIndicateurBody,
): Promise<Result<void, AddCollectionIndicateurError>> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

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
): ResultAsync<CollectionApiModel, AddCollectionIndicateurError> =>
  new ResultAsync(performAdd(publicId, body)).andThen(() => getCollectionByPublicId(publicId))
