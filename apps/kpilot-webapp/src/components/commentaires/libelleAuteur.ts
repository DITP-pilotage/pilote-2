import { type AuteurApiModel } from '@pilote/kpilot-shared/auteur'

export const libelleAuteur = (auteur: AuteurApiModel): string =>
  auteur.type === 'utilisateur' ? auteur.email : auteur.label
