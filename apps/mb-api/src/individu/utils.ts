import { type IndividuApiModel } from '@pilote/mb-shared/individu'

import { type IndividuModel, type ReferentielIndividuModel } from '@/generated/prisma/models'

export type IndividuWithReferentiels = IndividuModel & {
  referentiels: Array<ReferentielIndividuModel & { referentiel: { publicId: string } }>
}

export const toIndividuApiModel = (individu: IndividuWithReferentiels): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiels: individu.referentiels.map((rel) => rel.referentiel.publicId),
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
