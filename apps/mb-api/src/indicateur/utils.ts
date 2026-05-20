import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { type FonctionAgregation } from '@/generated/prisma/enums'
import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: Pick<ReferentielModel, 'publicId'>
  }>
}

export const toIndicateurApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  referentiels: indicateur.referentiels
    .map((link) => ({
      referentielId: link.referentiel.publicId,
      fonctionAgregation: link.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielId.localeCompare(b.referentielId)),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
