import { type PanierApiModel } from '@pilote/mb-shared/panier'

import { type IndicateurModel, type PanierModel } from '@/generated/prisma/models'

export type PanierWithIndicateurs = PanierModel & {
  indicateurs: Array<{ indicateur: Pick<IndicateurModel, 'publicId'> }>
}

// L'ordre des `indicateurs` est garanti par la query Prisma
// (`orderBy: { createdAt: 'asc' }` dans l'include).
export const toPanierApiModel = (panier: PanierWithIndicateurs): PanierApiModel => ({
  id: panier.publicId,
  nom: panier.nom,
  description: panier.description,
  visibilite: panier.visibilite,
  indicateurIds: panier.indicateurs.map((lien) => lien.indicateur.publicId),
  createdAt: panier.createdAt.toISOString(),
  updatedAt: panier.updatedAt.toISOString(),
})
