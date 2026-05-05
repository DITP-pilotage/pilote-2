import { type IndicateurApiModel } from '@pilote/mb-shared/api'

import { type IndicateurModel } from '@/generated/prisma/models'

export const toIndicateurApiModel = (indicateur: IndicateurModel): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
