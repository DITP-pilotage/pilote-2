import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { type FonctionAgregation } from '@/generated/prisma/enums'
import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: ReferentielModel
  }>
}

export const toIndicateurApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  visibilite: indicateur.visibilite,
  referentiels: indicateur.referentiels
    .map((configuration) => ({
      referentielPublicId: configuration.referentiel.publicId,
      fonctionAgregation: configuration.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielPublicId.localeCompare(b.referentielPublicId)),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
