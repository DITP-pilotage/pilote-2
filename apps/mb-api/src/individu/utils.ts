import { type IndividuApiModel, individuMetadataSchema } from '@pilote/mb-shared/individu'

import { type IndividuModel } from '@/generated/prisma/models'

export type IndividuWithReferentiel = IndividuModel & {
  referentiel: { publicId: string }
}

const toMetadata = (raw: IndividuModel['metadata']): IndividuApiModel['metadata'] => {
  const result = individuMetadataSchema.safeParse(raw)
  return result.success ? result.data : null
}

export const toIndividuApiModel = (individu: IndividuWithReferentiel): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
  metadata: toMetadata(individu.metadata),
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
