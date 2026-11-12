import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { MESSAGE_ADMIN } from '@/axe/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export type DeleteModaliteError =
  | { type: 'MODALITE_A_DES_ENFANTS'; enfants: string[] }
  | { type: 'MODALITE_UTILISEE'; combinaisons: number }

const performDelete = async ({
  axePublicId,
  publicId,
}: {
  axePublicId: string
  publicId: string
}): Promise<Result<void, DeleteModaliteError>> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const modalite = await db().modalite.findFirst({
    where: { publicId, axe: { publicId: axePublicId } },
    include: {
      enfants: { orderBy: { publicId: 'asc' } },
      _count: { select: { combinaisons: true } },
    },
  })
  if (!modalite) {
    throw new NotFoundError('Modalité introuvable dans cet axe.', { axe: axePublicId, publicId })
  }
  if (modalite.enfants.length > 0) {
    return err({ type: 'MODALITE_A_DES_ENFANTS', enfants: modalite.enfants.map((e) => e.publicId) })
  }

  // Une modalité utilisée par une combinaison précise des valeurs : la
  // supprimer les rendrait orphelines.
  if (modalite._count.combinaisons > 0) {
    return err({ type: 'MODALITE_UTILISEE', combinaisons: modalite._count.combinaisons })
  }

  await db().modalite.delete({ where: { id: modalite.id } })
  return ok()
}

export const deleteModalite = (params: {
  axePublicId: string
  publicId: string
}): ResultAsync<void, DeleteModaliteError> =>
  ResultAsync.fromSafePromise(performDelete(params)).andThen((r) => r)
