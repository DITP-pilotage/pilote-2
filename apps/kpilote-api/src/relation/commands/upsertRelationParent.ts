import { type UpsertRelationBody } from '@pilote/kpilote-shared/relation'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type UpsertRelationParentError = { type: 'AUTO_PARENT' } | { type: 'CYCLE_DETECTE' }

// Remontée des ancêtres du candidat. Le Set de visités protège des cycles déjà
// présents en base : les données historiques n'ont pas traversé cette garde.
const estDescendant = async (candidatId: string, ancetreId: string): Promise<boolean> => {
  const visites = new Set<string>([candidatId])
  let courant = [candidatId]

  while (courant.length > 0) {
    if (courant.includes(ancetreId)) return true
    const relations = await db().relation.findMany({
      where: { childId: { in: courant } },
      select: { parentId: true },
    })
    courant = relations.map((relation) => relation.parentId).filter((id) => !visites.has(id))
    for (const id of courant) visites.add(id)
  }

  return false
}

const performUpsert = async (
  enfantPublicId: string,
  body: UpsertRelationBody,
): Promise<Result<void, UpsertRelationParentError>> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )

  if (enfantPublicId === body.parent) return err({ type: 'AUTO_PARENT' })

  const enfant = await db().individu.findUniqueOrThrow({
    where: { publicId: enfantPublicId },
    select: { id: true },
  })
  const parent = await db().individu.findUniqueOrThrow({
    where: { publicId: body.parent },
    select: { id: true },
  })

  if (await estDescendant(parent.id, enfant.id)) return err({ type: 'CYCLE_DETECTE' })

  await db().relation.deleteMany({ where: { childId: enfant.id } })
  await db().relation.create({
    data: { id: uuidv7(), parentId: parent.id, childId: enfant.id },
  })

  return ok(undefined)
}

export const upsertRelationParent = (
  enfantPublicId: string,
  body: UpsertRelationBody,
): ResultAsync<void, UpsertRelationParentError> =>
  ResultAsync.fromSafePromise(performUpsert(enfantPublicId, body)).andThen((result) => result)
