import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { countValeursForModalite } from '@/axe/countValeursForModalite'
import { checkModaliteSupprimable, type ModaliteNonSupprimableError } from '@/axe/rules'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export type DeleteModaliteError = ModaliteNonSupprimableError

const performDelete = async ({
  axePublicId,
  publicId,
}: {
  axePublicId: string
  publicId: string
}): Promise<Result<void, DeleteModaliteError>> => {
  ensureAdmin()

  const modalite = await db().modalite.findFirst({
    where: { publicId, axe: { publicId: axePublicId } },
    include: { enfants: { orderBy: { publicId: 'asc' } } },
  })
  if (!modalite) {
    throw new NotFoundError('Modalité introuvable dans cet axe.', { axe: axePublicId, publicId })
  }
  const nombreValeurs = await countValeursForModalite({ modaliteId: modalite.id })

  const supprimable = checkModaliteSupprimable({
    enfants: modalite.enfants.map((enfant) => enfant.publicId),
    nombreValeurs,
  })
  if (supprimable.isErr()) return err(supprimable.error)

  // Les combinaisons de la modalité ne portent aucune valeur : elles
  // disparaissent avec elle (le cascade retire leurs lignes, y compris celles
  // des autres axes). Si une valeur arrivait entre-temps, la clé étrangère
  // `Restrict` de `valeur_avancement` fait échouer la suppression.
  await db().combinaison.deleteMany({
    where: { modalites: { some: { modaliteId: modalite.id } } },
  })
  await db().modalite.delete({ where: { id: modalite.id } })
  return ok()
}

export const deleteModalite = (params: {
  axePublicId: string
  publicId: string
}): ResultAsync<void, DeleteModaliteError> => new ResultAsync(performDelete(params))
