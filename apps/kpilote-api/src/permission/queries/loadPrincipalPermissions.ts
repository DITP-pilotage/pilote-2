import { type PrincipalPermissionsApiModel } from '@pilote/kpilote-shared/permission'

import { db } from '@/framework/persistence/dbStore'
import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'
import { COLLECTION_ACTION_ORDER, INDICATEUR_ACTION_ORDER, sortByOrder } from '@/permission/order'

type IndicateurEntry = { publicId: string; nom: string; actions: Set<IndicateurPermissionAction> }
type CollectionEntry = { publicId: string; nom: string; actions: Set<CollectionPermissionAction> }

const serializeMap = <T>(
  map: Map<string, { publicId: string; nom: string; actions: Set<T> }>,
  order: readonly T[],
) =>
  Array.from(map.values())
    .map((e) => ({
      publicId: e.publicId,
      nom: e.nom,
      actions: sortByOrder([...e.actions], order),
    }))
    .sort((a, b) => a.publicId.localeCompare(b.publicId))

// Charge les permissions directes (groupées par ressource) + les indicateurs
// hérités en READ via propagation collection → indicateur (cf. permissions-design.md).
// Pur : aucune garde d'autorisation ici (assurée par l'appelant).
export const loadPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const [collectionPerms, indicateurPerms] = await Promise.all([
    db().collectionPermission.findMany({
      where: { principalId },
      include: {
        collection: {
          select: {
            publicId: true,
            nom: true,
            indicateurs: { select: { indicateur: { select: { publicId: true, nom: true } } } },
          },
        },
      },
    }),
    db().indicateurPermission.findMany({
      where: { principalId },
      include: { indicateur: { select: { publicId: true, nom: true } } },
    }),
  ])

  const collectionsMap = new Map<string, CollectionEntry>()
  for (const p of collectionPerms) {
    const entry = collectionsMap.get(p.collection.publicId) ?? {
      publicId: p.collection.publicId,
      nom: p.collection.nom,
      actions: new Set<CollectionPermissionAction>(),
    }
    entry.actions.add(p.action)
    collectionsMap.set(p.collection.publicId, entry)
  }

  const indicateursMap = new Map<string, IndicateurEntry>()
  for (const i of indicateurPerms) {
    const entry = indicateursMap.get(i.indicateur.publicId) ?? {
      publicId: i.indicateur.publicId,
      nom: i.indicateur.nom,
      actions: new Set<IndicateurPermissionAction>(),
    }
    entry.actions.add(i.action)
    indicateursMap.set(i.indicateur.publicId, entry)
  }

  const heritesMap = new Map<
    string,
    { publicId: string; nom: string; viaCollectionPublicId: string; viaCollectionNom: string }
  >()
  for (const p of collectionPerms) {
    for (const lien of p.collection.indicateurs) {
      const pubId = lien.indicateur.publicId
      if (indicateursMap.has(pubId) || heritesMap.has(pubId)) continue
      heritesMap.set(pubId, {
        publicId: pubId,
        nom: lien.indicateur.nom,
        viaCollectionPublicId: p.collection.publicId,
        viaCollectionNom: p.collection.nom,
      })
    }
  }

  return {
    collections: serializeMap(collectionsMap, COLLECTION_ACTION_ORDER),
    indicateurs: serializeMap(indicateursMap, INDICATEUR_ACTION_ORDER),
    indicateursHerites: Array.from(heritesMap.values()).sort((a, b) =>
      a.publicId.localeCompare(b.publicId),
    ),
  }
}
