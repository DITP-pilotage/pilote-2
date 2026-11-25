import { type UpsertModaliteBody } from '@pilote/kpilote-shared/axe'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { countValeursForModalite } from '@/axe/countValeursForModalite'
import {
  type ChangementParentInterditError,
  checkModaliteDansAxe,
  checkNiveauExiste,
  checkParentInchange,
  checkParentModalite,
  checkParentSansValeur,
  type ModaliteAutreAxeError,
  type NiveauInexistantError,
  type ParentModaliteError,
  type ParentPorteValeursError,
} from '@/axe/rules'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type UpsertModaliteError =
  | ModaliteAutreAxeError
  | ChangementParentInterditError
  | ParentModaliteError
  | NiveauInexistantError
  | ParentPorteValeursError

type UpsertModaliteParams = { axePublicId: string; publicId: string; body: UpsertModaliteBody }

const loadParent = async ({ publicId }: { publicId: string | null }) => {
  if (publicId === null) return null
  const parent = await db().modalite.findUnique({
    where: { publicId },
    include: { axe: true, niveauAxe: true, _count: { select: { enfants: true } } },
  })
  if (!parent) return null
  return {
    id: parent.id,
    publicId: parent.publicId,
    axeId: parent.axeId,
    axePublicId: parent.axe.publicId,
    ordre: parent.niveauAxe.ordre,
    nombreValeurs: await countValeursForModalite({ modaliteId: parent.id }),
    nombreEnfants: parent._count.enfants,
  }
}

const performUpsert = async ({
  axePublicId,
  publicId,
  body,
}: UpsertModaliteParams): Promise<Result<void, UpsertModaliteError>> => {
  ensureAdmin()

  // Axe inconnu : P2025, converti en 404.
  const axe = await db().axe.findUniqueOrThrow({
    where: { publicId: axePublicId },
    include: { niveaux: true },
  })
  const existante = await db().modalite.findUnique({
    where: { publicId },
    include: { axe: true, parent: true },
  })

  const dansAxe = checkModaliteDansAxe({
    axeId: axe.id,
    existante: existante && { axeId: existante.axeId, axePublicId: existante.axe.publicId },
  })
  if (dansAxe.isErr()) return err(dansAxe.error)

  if (existante) {
    const parentInchange = checkParentInchange({
      parentActuel: existante.parent?.publicId ?? null,
      parentCible: body.parent,
    })
    if (parentInchange.isErr()) return err(parentInchange.error)

    await db().modalite.update({ where: { id: existante.id }, data: { nom: body.nom } })
    return ok()
  }

  const parent = await loadParent({ publicId: body.parent })

  const position = checkParentModalite({ axeId: axe.id, parentPublicId: body.parent, parent })
  if (position.isErr()) return err(position.error)

  const niveau = checkNiveauExiste({ niveaux: axe.niveaux, ordre: position.value.ordre })
  if (niveau.isErr()) return err(niveau.error)

  const sansValeur = checkParentSansValeur({ parent })
  if (sansValeur.isErr()) return err(sansValeur.error)

  await db().modalite.create({
    data: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      axeId: axe.id,
      niveauAxeId: niveau.value.id,
      parentId: position.value.parentId,
    },
  })
  return ok()
}

export const upsertModalite = (
  params: UpsertModaliteParams,
): ResultAsync<void, UpsertModaliteError> => new ResultAsync(performUpsert(params))
