import { err, ok, type Result } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'

export type IndividuInconnuError = { type: 'INDIVIDU_INCONNU'; individu: string }

// Un individu inconnu et un individu hors des référentiels de l'indicateur
// renvoient la même erreur.
export const resolveAuthorizedIndividu = async ({
  individuPublicId,
  indicateurId,
}: {
  individuPublicId: string
  indicateurId: string
}): Promise<Result<{ id: string; publicId: string }, IndividuInconnuError>> => {
  const individu = await db().individu.findUnique({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })
  if (!individu) return err({ type: 'INDIVIDU_INCONNU', individu: individuPublicId })
  const link = await db().indicateurReferentiel.findUnique({
    where: {
      indicateurId_referentielId: { indicateurId, referentielId: individu.referentielId },
    },
  })
  if (!link) return err({ type: 'INDIVIDU_INCONNU', individu: individuPublicId })
  return ok({ id: individu.id, publicId: individu.publicId })
}
