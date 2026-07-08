import { type IndividuApiModel, individuMetadataSchema } from '@pilote/kpilote-shared/individu'

import { type IndividuModel, type RelationModel } from '@/generated/prisma/models'

export type IndividuWithReferentiel = IndividuModel & {
  referentiel: { publicId: string }
  relationsAsChild: (RelationModel & { parent: { publicId: string } })[]
}

export const individuInclude = {
  referentiel: true,
  relationsAsChild: { include: { parent: true } },
} as const

const toMetadata = (raw: IndividuModel['metadata']): IndividuApiModel['metadata'] => {
  const result = individuMetadataSchema.safeParse(raw)
  return result.success ? result.data : null
}

export const toIndividuApiModel = (individu: IndividuWithReferentiel): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
  parents: individu.relationsAsChild.map((relation) => relation.parent.publicId).sort(),
  metadata: toMetadata(individu.metadata),
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
