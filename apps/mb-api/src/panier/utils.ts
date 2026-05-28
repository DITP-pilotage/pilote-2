import { type PanierApiModel } from '@pilote/mb-shared/panier'

import { type IndicateurModel, type PanierModel } from '@/generated/prisma/models'

export type PanierWithIndicateurs = PanierModel & {
  indicateurs: Array<{
    createdAt: Date
    indicateur: Pick<IndicateurModel, 'publicId'>
  }>
}

export const toPanierApiModel = (panier: PanierWithIndicateurs): PanierApiModel => ({
  id: panier.publicId,
  nom: panier.nom,
  description: panier.description,
  indicateurIds: panier.indicateurs
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((lien) => lien.indicateur.publicId),
  createdAt: panier.createdAt.toISOString(),
  updatedAt: panier.updatedAt.toISOString(),
})
