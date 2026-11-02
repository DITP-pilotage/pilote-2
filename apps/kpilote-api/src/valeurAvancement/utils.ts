import {
  type IndividuAvecValeursApiModel,
  type ValeurSaisieApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'

import { type ValeurAvancementModel } from '@/generated/prisma/models'
import { type IndividuWithReferentiel, toIndividuApiModel } from '@/individu/utils'

export const toValeurSaisieApiModel = ({
  valeur,
  indicateurPublicId,
  celluleId,
}: {
  valeur: ValeurAvancementModel
  indicateurPublicId: string
  // Identifiant public de la cellule (= publicId de l'individu en mono-dimension).
  celluleId: string
}): ValeurSaisieApiModel => ({
  indicateur: indicateurPublicId,
  individu: celluleId,
  date: valeur.date,
  valeur: valeur.valeur.toNumber(),
  type: 'saisie',
})

export type IndividuAvecValeursRow = IndividuWithReferentiel & {
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
