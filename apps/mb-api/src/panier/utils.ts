import { type PanierApiModel } from '@pilote/mb-shared/panier'

import {
  type IndicateurModel,
  type PanierModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

export type PanierWithIndicateurs = PanierModel & {
  indicateurs: Array<{ indicateur: Pick<IndicateurModel, 'publicId'> }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
}

// L'ordre des `indicateurs` est garanti par la query Prisma
// (`orderBy: { createdAt: 'asc' }` dans l'include).
export const toPanierApiModel = (panier: PanierWithIndicateurs): PanierApiModel => ({
  id: panier.publicId,
  nom: panier.nom,
  description: panier.description,
  visibilite: panier.visibilite,
  indicateurIds: panier.indicateurs.map((lien) => lien.indicateur.publicId),
  // `responsables` est projeté ici : toute query réutilisant ce mapper (getPanierByPublicId ET listPaniers) doit inclure la relation, sinon `.map` échoue.
  responsables: panier.responsables.map(({ utilisateur: u }) => ({
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    service: u.service,
    fonction: u.fonction,
  })),
  createdAt: panier.createdAt.toISOString(),
  updatedAt: panier.updatedAt.toISOString(),
})
