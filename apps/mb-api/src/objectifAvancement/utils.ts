import { type ObjectifAvancementApiModel } from '@pilote/mb-shared/objectifAvancement'

import { type ObjectifAvancementModel } from '@/generated/prisma/models'

export type ObjectifAvancementWithRelations = ObjectifAvancementModel & {
  indicateur: { publicId: string }
  individu: { publicId: string }
}

export const toObjectifAvancementApiModel = (
  objectif: ObjectifAvancementWithRelations,
): ObjectifAvancementApiModel => ({
  indicateur: objectif.indicateur.publicId,
  individu: objectif.individu.publicId,
  date: objectif.date,
  valeur: objectif.valeur.toNumber(),
})
