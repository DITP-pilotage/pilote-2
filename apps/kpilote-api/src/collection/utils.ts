import { type CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { type CollectionContactsUtilesGroup } from '@pilote/kpilote-shared/collectionContactUtile'

import { type Decimal } from '@/framework/decimal'
import {
  type ContactUtileModel,
  type CollectionModel,
  type IndicateurModel,
  type OrganismeModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

type ContactUtileLien = { contactUtile: ContactUtileModel & { organisme: OrganismeModel } }

export type CollectionWithIndicateurs = CollectionModel & {
  indicateurs: Array<{ ponderation: Decimal; indicateur: Pick<IndicateurModel, 'publicId'> }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
  contactsUtiles: ContactUtileLien[]
}

// Regroupe les contacts utiles par organisme, organismes et contacts triés par
// nom. Le tri se fait ici (et non côté SQL) car les contacts sont chargés via
// `include` sur la collection, sans passer par une query dédiée.
const toContactsUtilesGroups = (liens: ContactUtileLien[]): CollectionContactsUtilesGroup[] => {
  const parOrganisme = new Map<string, CollectionContactsUtilesGroup>()
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
export const toCollectionApiModel = (
  collection: CollectionWithIndicateurs,
): CollectionApiModel => ({
  id: collection.publicId,
  nom: collection.nom,
  description: collection.description,
  visibilite: collection.visibilite,
  indicateurs: collection.indicateurs.map((lien) => ({
    id: lien.indicateur.publicId,
    ponderation: lien.ponderation.toNumber(),
  })),
  responsables: collection.responsables.map(({ utilisateur }) => ({
    id: utilisateur.id,
    email: utilisateur.email,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    service: utilisateur.service,
    fonction: utilisateur.fonction,
  })),
  contactsUtiles: toContactsUtilesGroups(collection.contactsUtiles),
  createdAt: collection.createdAt.toISOString(),
  updatedAt: collection.updatedAt.toISOString(),
})
