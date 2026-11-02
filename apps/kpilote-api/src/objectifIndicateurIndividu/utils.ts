import { type ObjectifIndicateurIndividuApiModel } from '@pilote/kpilote-shared/objectifIndicateurIndividu'

import { type ObjectifIndicateurIndividuModel } from '@/generated/prisma/models'

export const toObjectifIndicateurIndividuApiModel = ({
  objectif,
  indicateurPublicId,
  celluleId,
}: {
  objectif: ObjectifIndicateurIndividuModel
  indicateurPublicId: string
  // Identifiant public de la cellule (= publicId de l'individu en mono-dimension).
  celluleId: string
}): ObjectifIndicateurIndividuApiModel => ({
  indicateur: indicateurPublicId,
  individu: celluleId,
  dateCible: objectif.dateCible,
  valeurCible: objectif.valeurCible.toNumber(),
  type: 'saisie',
})
