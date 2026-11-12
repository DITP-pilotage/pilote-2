import { type ModaliteListApiModel } from '@pilote/kpilote-shared/axe'
import { ResultAsync } from 'neverthrow'

import { modaliteInclude, toModaliteApiModel } from '@/axe/utils'
import { db } from '@/framework/persistence/dbStore'

// Toutes les modalités d'un axe, sans pagination : le client reconstruit
// l'arbre à partir de `parent`. Axe inconnu : 404 (P2025).
const fetchModalites = async (axePublicId: string) => {
  const axe = await db().axe.findUniqueOrThrow({ where: { publicId: axePublicId } })
  return db().modalite.findMany({
    where: { axeId: axe.id },
    include: modaliteInclude,
    orderBy: [{ niveauAxe: { ordre: 'asc' } }, { nom: 'asc' }, { publicId: 'asc' }],
  })
}

export const listModalitesForAxe = ({
  axePublicId,
}: {
  axePublicId: string
}): ResultAsync<ModaliteListApiModel, never> =>
  ResultAsync.fromSafePromise(fetchModalites(axePublicId)).map((rows) => ({
    items: rows.map(toModaliteApiModel),
  }))
