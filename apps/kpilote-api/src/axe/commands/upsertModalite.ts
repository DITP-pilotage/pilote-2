import { type UpsertModaliteBody } from '@pilote/kpilote-shared/axe'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireAdmin } from '@/axe/utils'
import { db } from '@/framework/persistence/dbStore'

export type UpsertModaliteError =
  | { type: 'MODALITE_AUTRE_AXE'; axe: string }
  | { type: 'CHANGEMENT_PARENT_INTERDIT'; parentActuel: string | null }
  | { type: 'PARENT_INCONNU' }
  | { type: 'PARENT_AUTRE_AXE'; axe: string }
  | { type: 'NIVEAU_INEXISTANT'; ordre: number }

// Le niveau d'une modalité se déduit de son parent (premier niveau sans
// parent, sinon niveau du parent + 1). Il est fixé à la création : une
// modification ne change que le nom, le parent ne peut pas changer.
const performUpsert = async ({
  axePublicId,
  publicId,
  body,
}: {
  axePublicId: string
  publicId: string
  body: UpsertModaliteBody
}): Promise<Result<void, UpsertModaliteError>> => {
  requireAdmin()

  // Axe inconnu : P2025, converti en 404.
  const axe = await db().axe.findUniqueOrThrow({
    where: { publicId: axePublicId },
    include: { niveaux: true },
  })

  const existing = await db().modalite.findUnique({
    where: { publicId },
    include: { axe: true, parent: true },
  })
  if (existing && existing.axeId !== axe.id) {
    return err({ type: 'MODALITE_AUTRE_AXE', axe: existing.axe.publicId })
  }
  if (existing) {
    const parentActuel = existing.parent?.publicId ?? null
    if (parentActuel !== body.parent) {
      return err({ type: 'CHANGEMENT_PARENT_INTERDIT', parentActuel })
    }
    await db().modalite.update({ where: { id: existing.id }, data: { nom: body.nom } })
    return ok()
  }

  let parentId: string | null = null
  let ordre = 1
  if (body.parent !== null) {
    const parent = await db().modalite.findUnique({
      where: { publicId: body.parent },
      include: { axe: true, niveauAxe: true },
    })
    if (!parent) return err({ type: 'PARENT_INCONNU' })
    if (parent.axeId !== axe.id) return err({ type: 'PARENT_AUTRE_AXE', axe: parent.axe.publicId })
    parentId = parent.id
    ordre = parent.niveauAxe.ordre + 1
  }

  const niveau = axe.niveaux.find((n) => n.ordre === ordre)
  if (!niveau) return err({ type: 'NIVEAU_INEXISTANT', ordre })

  await db().modalite.create({
    data: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      axeId: axe.id,
      niveauAxeId: niveau.id,
      parentId,
    },
  })
  return ok()
}

export const upsertModalite = (params: {
  axePublicId: string
  publicId: string
  body: UpsertModaliteBody
}): ResultAsync<void, UpsertModaliteError> =>
  ResultAsync.fromSafePromise(performUpsert(params)).andThen((r) => r)
