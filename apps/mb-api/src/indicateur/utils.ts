import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{ referentiel: Pick<ReferentielModel, 'publicId'> }>
}

export const toIndicateurApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  referentielIds: [...indicateur.referentiels.map((link) => link.referentiel.publicId)].sort(),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
