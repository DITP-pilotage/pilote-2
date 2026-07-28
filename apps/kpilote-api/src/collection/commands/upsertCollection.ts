import {
  type CollectionApiModel,
  type UpsertCollectionBody,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

// Seuls les champs scalaires sont remplacés : les affectations (indicateurs,
// responsables, permissions) ont leurs propres routes, et les inclure ici
// permettrait à l'écran d'édition d'écraser un ajout concurrent.
const performUpsert = async (publicId: string, body: UpsertCollectionBody): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const champs = { nom: body.nom, description: body.description, visibilite: body.visibilite }
  await db().collection.upsert({
    where: { publicId },
    update: champs,
    create: { id: uuidv7(), publicId, ...champs },
  })
}

export const upsertCollection = (
  publicId: string,
  body: UpsertCollectionBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performUpsert(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
