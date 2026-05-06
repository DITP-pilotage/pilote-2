import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'

import { type ReferentielModel } from '@/generated/prisma/models'

export type ReferentielWithCount = ReferentielModel & {
  _count: { individus: number }
}

export const toReferentielApiModel = (
  referentiel: ReferentielWithCount,
): ReferentielApiModel => ({
  id: referentiel.publicId,
  nom: referentiel.nom,
  description: referentiel.description,
  nombreIndividus: referentiel._count.individus,
  createdAt: referentiel.createdAt.toISOString(),
  updatedAt: referentiel.updatedAt.toISOString(),
})
