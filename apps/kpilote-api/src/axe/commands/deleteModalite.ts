import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { requireAdmin } from '@/axe/utils'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export type DeleteModaliteError = { type: 'MODALITE_A_DES_ENFANTS'; enfants: string[] }

const performDelete = async ({
  axePublicId,
  publicId,
}: {
  axePublicId: string
  publicId: string
}): Promise<Result<void, DeleteModaliteError>> => {
  requireAdmin()

  const modalite = await db().modalite.findFirst({
    where: { publicId, axe: { publicId: axePublicId } },
    include: { enfants: { orderBy: { publicId: 'asc' } } },
  })
  if (!modalite) {
    throw new NotFoundError('Modalité introuvable dans cet axe.', { axe: axePublicId, publicId })
  }
  if (modalite.enfants.length > 0) {
    return err({ type: 'MODALITE_A_DES_ENFANTS', enfants: modalite.enfants.map((e) => e.publicId) })
  }

  await db().modalite.delete({ where: { id: modalite.id } })
  return ok()
}

export const deleteModalite = (params: {
  axePublicId: string
  publicId: string
}): ResultAsync<void, DeleteModaliteError> =>
  ResultAsync.fromSafePromise(performDelete(params)).andThen((r) => r)
