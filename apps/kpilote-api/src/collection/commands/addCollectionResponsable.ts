import { type AddCollectionResponsableBody } from '@pilote/kpilote-shared/collection'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

export type AddCollectionResponsableError = { type: 'RESPONSABLE_DEJA_AFFECTE' }

const performAdd = async (
  publicId: string,
  body: AddCollectionResponsableBody,
): Promise<Result<void, AddCollectionResponsableError>> => {
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
  if (existant) return err({ type: 'RESPONSABLE_DEJA_AFFECTE' })

  await db().collectionResponsable.create({
    data: { collectionId: collection.id, utilisateurId: body.utilisateurId },
  })
  return ok()
}

export const addCollectionResponsable = (
  publicId: string,
  body: AddCollectionResponsableBody,
): ResultAsync<void, AddCollectionResponsableError> => new ResultAsync(performAdd(publicId, body))
