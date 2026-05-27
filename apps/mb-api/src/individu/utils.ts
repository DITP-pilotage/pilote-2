import { type IndividuApiModel } from '@pilote/mb-shared/individu'

import { type IndividuModel } from '@/generated/prisma/models'

export type IndividuWithReferentiel = IndividuModel & {
  referentiel: { publicId: string }
}

const toMetadata = (raw: IndividuModel['metadata']): IndividuApiModel['metadata'] => {
  if (raw === null || raw === undefined) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

export const toIndividuApiModel = (individu: IndividuWithReferentiel): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
  metadata: toMetadata(individu.metadata),
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
