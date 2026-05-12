import {
  type IndividuAvecValeursApiModel,
  type ValeurAvancementApiModel,
} from '@pilote/mb-shared/valeurAvancement'

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
  date: valeur.date,
  valeur: valeur.valeur.toNumber(),
})

export type IndividuAvecValeursRow = IndividuWithReferentiels & {
  valeurs: ValeurAvancementModel[]
  _count: { valeurs: number }
}

export const toIndividuAvecValeursApiModel = (
  row: IndividuAvecValeursRow,
): IndividuAvecValeursApiModel => {
  const derniere = row.valeurs[0]
  if (!derniere) {
    throw new Error(
      `Individu ${row.publicId} a un nombreValeurs > 0 mais aucune valeur dans le payload — incohérence interne.`,
    )
  }
  return {
    individu: toIndividuApiModel(row),
    derniereValeur: {
      date: derniere.date,
      valeur: derniere.valeur.toNumber(),
    },
    nombreValeurs: row._count.valeurs,
  }
}
