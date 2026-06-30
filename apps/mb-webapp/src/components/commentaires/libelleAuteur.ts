import { type AuteurApiModel } from '@pilote/mb-shared/auteur'

export const libelleAuteur = (auteur: AuteurApiModel): string =>
  auteur.type === 'utilisateur' ? auteur.email : auteur.label
