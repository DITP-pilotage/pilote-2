import { type UpsertRelationBody } from '@pilote/kpilote-shared/relation'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import {
  type AutoParentError,
  checkPasAutoParent,
  checkSansCycle,
  type CycleDetecteError,
} from '@/relation/rules'

export type UpsertRelationParentError = AutoParentError | CycleDetecteError

// L'individu puis tous ses ancêtres. Le Set de visités protège des cycles déjà
// présents en base : les données historiques n'ont pas traversé cette règle.
const loadCheminVersRacine = async ({ individuId }: { individuId: string }): Promise<string[]> => {
  const visites = new Set<string>([individuId])
  let courant = [individuId]

  while (courant.length > 0) {
    const relations = await db().relation.findMany({
      where: { childId: { in: courant } },
      select: { parentId: true },
    })
    courant = relations.map((relation) => relation.parentId).filter((id) => !visites.has(id))
    for (const id of courant) visites.add(id)
  }

  return [...visites]
}

const performUpsert = async (
  enfantPublicId: string,
  body: UpsertRelationBody,
): Promise<Result<void, UpsertRelationParentError>> => {
  ensureAdmin()

  const autoParent = checkPasAutoParent({ enfantPublicId, parentPublicId: body.parent })
  if (autoParent.isErr()) return err(autoParent.error)

  const enfant = await db().individu.findUniqueOrThrow({
    where: { publicId: enfantPublicId },
    select: { id: true },
  })
  const parent = await db().individu.findUniqueOrThrow({
    where: { publicId: body.parent },
    select: { id: true },
  })

  // Verrou sur la ligne de l'enfant pour la durée de la transaction. Sans lui,
  // et faute de contrainte d'unicité sur `child_id`, deux écritures concurrentes
  // sur le même enfant intercalent leur deleteMany/create et laissent deux
  // parents — le cas se produit même sans relation préexistante, puisque
  // `deleteMany` ne verrouille alors aucune ligne.
  await db().$executeRaw`SELECT id FROM individu WHERE id = ${enfant.id}::uuid FOR UPDATE`

  const sansCycle = checkSansCycle({
    enfantId: enfant.id,
    cheminDuParent: await loadCheminVersRacine({ individuId: parent.id }),
  })
  if (sansCycle.isErr()) return err(sansCycle.error)

  await db().relation.deleteMany({ where: { childId: enfant.id } })
  await db().relation.create({
    data: { id: uuidv7(), parentId: parent.id, childId: enfant.id },
  })

  return ok()
}

export const upsertRelationParent = (
  enfantPublicId: string,
  body: UpsertRelationBody,
): ResultAsync<void, UpsertRelationParentError> =>
  new ResultAsync(performUpsert(enfantPublicId, body))
