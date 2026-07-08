import { type PanierApiModel } from '@pilote/kpilot-shared/panier'
import { type PanierContactsUtilesGroup } from '@pilote/kpilot-shared/panierContactUtile'

import {
  type ContactUtileModel,
  type IndicateurModel,
  type OrganismeModel,
  type PanierModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

type ContactUtileLien = { contactUtile: ContactUtileModel & { organisme: OrganismeModel } }

export type PanierWithIndicateurs = PanierModel & {
  indicateurs: Array<{ indicateur: Pick<IndicateurModel, 'publicId'> }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
  contactsUtiles: ContactUtileLien[]
}

// Regroupe les contacts utiles par organisme, organismes et contacts triés par
// nom. Le tri se fait ici (et non côté SQL) car les contacts sont chargés via
// `include` sur le panier, sans passer par une query dédiée.
const toContactsUtilesGroups = (liens: ContactUtileLien[]): PanierContactsUtilesGroup[] => {
  const parOrganisme = new Map<string, PanierContactsUtilesGroup>()
  for (const { contactUtile } of liens) {
    const { organisme } = contactUtile
    let group = parOrganisme.get(organisme.id)
    if (!group) {
      group = { organisme: { id: organisme.id, nom: organisme.nom }, contacts: [] }
      parOrganisme.set(organisme.id, group)
    }
    group.contacts.push({
      id: contactUtile.id,
      nom: contactUtile.nom,
      description: contactUtile.description,
      telephone: contactUtile.telephone,
      email: contactUtile.email,
      url: contactUtile.url,
      adresse: contactUtile.adresse,
    })
  }
  return [...parOrganisme.values()]
    .sort((a, b) => a.organisme.nom.localeCompare(b.organisme.nom))
    .map((group) => ({
      ...group,
      contacts: [...group.contacts].sort((a, b) => a.nom.localeCompare(b.nom)),
    }))
}

// L'ordre des `indicateurs` est garanti par la query Prisma
// (`orderBy: { createdAt: 'asc' }` dans l'include).
export const toPanierApiModel = (panier: PanierWithIndicateurs): PanierApiModel => ({
  id: panier.publicId,
  nom: panier.nom,
  description: panier.description,
  visibilite: panier.visibilite,
  indicateurIds: panier.indicateurs.map((lien) => lien.indicateur.publicId),
  responsables: panier.responsables.map(({ utilisateur }) => ({
    email: utilisateur.email,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    service: utilisateur.service,
    fonction: utilisateur.fonction,
  })),
  contactsUtiles: toContactsUtilesGroups(panier.contactsUtiles),
  createdAt: panier.createdAt.toISOString(),
  updatedAt: panier.updatedAt.toISOString(),
})
