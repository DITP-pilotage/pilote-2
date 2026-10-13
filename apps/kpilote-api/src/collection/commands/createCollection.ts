import {
  type CollectionApiModel,
  type CreateCollectionBody,
} from '@pilote/kpilote-shared/collection'
import { slugify } from '@pilote/kpilote-shared/slug'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { resolveSlug } from '@/framework/persistence/resolveSlug'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performCreate = async (body: CreateCollectionBody): Promise<string> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const base = slugify(body.nom)
  if (base === '') {
    throw new ValidationError('Impossible de dériver un identifiant public depuis le nom', {
      nom: body.nom,
    })
  }
  const publicId = await resolveSlug({ entite: 'collection', base })
  await db().collection.create({
    data: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      description: body.description,
      visibilite: body.visibilite,
    },
  })
  return publicId
}

export const createCollection = (
  body: CreateCollectionBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performCreate(body)).andThen(getCollectionByPublicId)
