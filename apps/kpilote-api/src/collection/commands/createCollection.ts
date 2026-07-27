import {
  type CollectionApiModel,
  type CreateCollectionBody,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { MESSAGE_ADMIN } from '@/collection/utils'

// Verrou consultatif porté par la transaction : deux créations concurrentes
// calculeraient sinon le même identifiant. Un retry sur violation d'unicité ne
// suffirait pas — sous Postgres, l'erreur avorte la transaction courante.
const lockPublicIdSequence = async (): Promise<void> => {
  await db().$executeRaw`SELECT pg_advisory_xact_lock(hashtext('collection_public_id'))`
}

// Cast en BIGINT et motif borné à 15 chiffres : les identifiants de test
// dépassent la capacité d'un INTEGER.
const nextPublicId = async (): Promise<string> => {
  const rows = await db().$queryRaw<Array<{ next: bigint }>>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 5) AS BIGINT)), 0) + 1 AS next
    FROM collection
    WHERE public_id ~ '^COL-[0-9]{1,15}$'
  `
  const next = rows[0]?.next ?? 1n
  return `COL-${String(next).padStart(3, '0')}`
}

const performCreate = async (body: CreateCollectionBody): Promise<string> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await lockPublicIdSequence()
  const publicId = await nextPublicId()
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
