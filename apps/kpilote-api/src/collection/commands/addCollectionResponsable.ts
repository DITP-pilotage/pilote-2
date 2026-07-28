import {
  type AddCollectionResponsableBody,
  type CollectionApiModel,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performAdd = async (publicId: string, body: AddCollectionResponsableBody): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  await db().utilisateur.findUniqueOrThrow({ where: { id: body.utilisateurId } })

  const existant = await db().collectionResponsable.findUnique({
    where: {
      collectionId_utilisateurId: {
        collectionId: collection.id,
        utilisateurId: body.utilisateurId,
      },
    },
  })
  if (existant) throw new ConflictError('Cet utilisateur est déjà responsable de la collection')

  await db().collectionResponsable.create({
    data: { collectionId: collection.id, utilisateurId: body.utilisateurId },
  })
}

export const addCollectionResponsable = (
  publicId: string,
  body: AddCollectionResponsableBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performAdd(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
