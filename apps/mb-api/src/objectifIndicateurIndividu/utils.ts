import { type ObjectifIndicateurIndividuApiModel } from '@pilote/mb-shared/objectifIndicateurIndividu'

import { type ObjectifIndicateurIndividuModel } from '@/generated/prisma/models'

export type ObjectifIndicateurIndividuWithRelations = ObjectifIndicateurIndividuModel & {
  indicateur: { publicId: string }
  individu: { publicId: string }
}

export const toObjectifIndicateurIndividuApiModel = (
  objectif: ObjectifIndicateurIndividuWithRelations,
): ObjectifIndicateurIndividuApiModel => ({
  indicateur: objectif.indicateur.publicId,
  individu: objectif.individu.publicId,
  date: objectif.date,
  valeur: objectif.valeur.toNumber(),
})
