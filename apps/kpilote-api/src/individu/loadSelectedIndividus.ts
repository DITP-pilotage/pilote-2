import { keyBy } from 'es-toolkit'

import { findUnknown } from '@/framework/collections/findUnknown'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieNoeud'

// Les individus d'une sélection, dans l'ordre de la sélection. Un individu
// inconnu lève une 404 qui les liste tous.
export const loadSelectedIndividus = async (
  publicIds: ReadonlyArray<string>,
): Promise<IndividuRef[]> => {
  const individus = await db().individu.findMany({ where: { publicId: { in: [...publicIds] } } })
  const inconnus = findUnknown({
    requested: publicIds,
    found: individus.map((individu) => individu.publicId),
  })
  if (inconnus.length > 0) {
    throw new NotFoundError('Individus introuvables', { individus: inconnus })
  }
  const individuByPublicId = keyBy(individus, (individu) => individu.publicId)
  return publicIds.flatMap((publicId) => individuByPublicId[publicId] ?? [])
}
