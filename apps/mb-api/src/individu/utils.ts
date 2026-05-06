import { type IndividuApiModel } from '@pilote/mb-shared/api'

import { type IndividuModel, type ReferentielIndividuModel } from '@/generated/prisma/models'

export type IndividuWithReferentiels = IndividuModel & {
  referentiels: Array<ReferentielIndividuModel & { referentiel: { publicId: string } }>
}

const toMetadata = (raw: unknown): Record<string, unknown> | null => {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return null
}

export const toIndividuApiModel = (individu: IndividuWithReferentiels): IndividuApiModel => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiels: individu.referentiels.map((rel) => rel.referentiel.publicId),
  metadata: toMetadata(individu.metadata),
  createdAt: individu.createdAt.toISOString(),
  updatedAt: individu.updatedAt.toISOString(),
})
