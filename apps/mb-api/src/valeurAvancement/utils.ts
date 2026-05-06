import {
  type IndividuAvecObservationsApiModel,
  type ValeurAvancementApiModel,
} from '@pilote/mb-shared/api'

import { type ValeurAvancementModel } from '@/generated/prisma/models'
import { type IndividuWithReferentiels, toIndividuApiModel } from '@/individu/utils'

export type ValeurAvancementWithRelations = ValeurAvancementModel & {
  indicateur: { publicId: string }
  individu: { publicId: string }
}

export const toValeurAvancementApiModel = (
  valeur: ValeurAvancementWithRelations,
): ValeurAvancementApiModel => ({
  indicateur: valeur.indicateur.publicId,
  individu: valeur.individu.publicId,
  dateObservation: valeur.dateObservation,
  valeur: valeur.valeur.toNumber(),
})

export type IndividuAvecObservationsRow = IndividuWithReferentiels & {
  valeurs: ValeurAvancementModel[]
  _count: { valeurs: number }
}

export const toIndividuAvecObservationsApiModel = (
  row: IndividuAvecObservationsRow,
): IndividuAvecObservationsApiModel => {
  const derniere = row.valeurs[0]
  if (!derniere) {
    throw new Error(
      `Individu ${row.publicId} a un nombreObservations > 0 mais aucune valeur dans le payload — incohérence interne.`,
    )
  }
  return {
    individu: toIndividuApiModel(row),
    derniereObservation: {
      dateObservation: derniere.dateObservation,
      valeur: derniere.valeur.toNumber(),
    },
    nombreObservations: row._count.valeurs,
  }
}
