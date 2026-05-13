import { type IndividuApiModel } from '@pilote/mb-shared/individu'

import { type IndividuModel } from '@/generated/prisma/models'

export type IndividuWithReferentiel = IndividuModel & {
  referentiel: { publicId: string }
}

export const toIndividuApiModel = (individu: IndividuWithReferentiel): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
