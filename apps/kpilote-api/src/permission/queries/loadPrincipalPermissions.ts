import { type PrincipalPermissionsApiModel } from '@pilote/kpilote-shared/permission'

import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

const ACTION_ORDER: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

type DirectEntry = { publicId: string; nom: string; actions: Set<PermissionAction> }

const serializeDirect = (map: Map<string, DirectEntry>) =>
  Array.from(map.values())
    .map((e) => ({
      publicId: e.publicId,
      nom: e.nom,
      actions: ACTION_ORDER.filter((a) => e.actions.has(a)),
    }))
    .sort((a, b) => a.publicId.localeCompare(b.publicId))

// Charge les permissions directes (groupées par ressource) + les indicateurs
// hérités en READ via propagation panier → indicateur (cf. permissions-design.md).
// Pur : aucune garde d'autorisation ici (assurée par l'appelant).
export const loadPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const [panierPerms, indicateurPerms] = await Promise.all([
    db().panierPermission.findMany({
      where: { principalId },
      include: {
        panier: {
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

  const paniersMap = new Map<string, DirectEntry>()
  for (const p of panierPerms) {
    const entry = paniersMap.get(p.panier.publicId) ?? {
      publicId: p.panier.publicId,
      nom: p.panier.nom,
      actions: new Set<PermissionAction>(),
    }
    entry.actions.add(p.action)
    paniersMap.set(p.panier.publicId, entry)
  }

  const indicateursMap = new Map<string, DirectEntry>()
  for (const i of indicateurPerms) {
    const entry = indicateursMap.get(i.indicateur.publicId) ?? {
      publicId: i.indicateur.publicId,
      nom: i.indicateur.nom,
      actions: new Set<PermissionAction>(),
    }
    entry.actions.add(i.action)
    indicateursMap.set(i.indicateur.publicId, entry)
  }

  const heritesMap = new Map<
    string,
    { publicId: string; nom: string; viaPanierPublicId: string; viaPanierNom: string }
  >()
  for (const p of panierPerms) {
    for (const lien of p.panier.indicateurs) {
      const pubId = lien.indicateur.publicId
      if (indicateursMap.has(pubId) || heritesMap.has(pubId)) continue
      heritesMap.set(pubId, {
        publicId: pubId,
        nom: lien.indicateur.nom,
        viaPanierPublicId: p.panier.publicId,
        viaPanierNom: p.panier.nom,
      })
    }
  }

  return {
    paniers: serializeDirect(paniersMap),
    indicateurs: serializeDirect(indicateursMap),
    indicateursHerites: Array.from(heritesMap.values()).sort((a, b) =>
      a.publicId.localeCompare(b.publicId),
    ),
  }
}
