import {
  type AddCollectionIndicateurBody,
  type CollectionApiModel,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performAdd = async (publicId: string, body: AddCollectionIndicateurBody): Promise<void> => {
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
  if (existant) throw new ConflictError('Cet indicateur est déjà affecté à la collection')

  await db().collectionIndicateur.create({
    data: {
      collectionId: collection.id,
      indicateurId: indicateur.id,
      ponderation: body.ponderation ?? 1,
    },
  })
}

export const addCollectionIndicateur = (
  publicId: string,
  body: AddCollectionIndicateurBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performAdd(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
