import { type MePermissionsApiModel } from '@pilote/mb-shared/mePermissions'
import { okAsync, ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type PermissionEntry = MePermissionsApiModel['paniers'][number]

const ACTION_ORDER: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

// READ panier (direct ou WRITE) propage en READ sur les indicateurs du panier.
// WRITE indicateur reste strictement direct — cf. permissions-design.md.
export const listerMesPermissions = (): ResultAsync<MePermissionsApiModel, never> => {
  if (isAdminPrincipal()) {
    return okAsync({ isAdmin: true, paniers: [], indicateurs: [] })
  }

  return ResultAsync.fromSafePromise(loadPermissions(requireCurrentPrincipalId())).map(
    buildResponse,
  )
}

const loadPermissions = (principalId: string) =>
  Promise.all([
    db().panierPermission.findMany({
      where: { principalId },
      include: {
        panier: {
          select: {
            publicId: true,
            indicateurs: { select: { indicateur: { select: { publicId: true } } } },
          },
        },
      },
    }),
    db().indicateurPermission.findMany({
      where: { principalId },
      include: { indicateur: { select: { publicId: true } } },
    }),
  ])

type LoadResult = Awaited<ReturnType<typeof loadPermissions>>

const buildResponse = ([panierPerms, indicateurPerms]: LoadResult): MePermissionsApiModel => {
  const paniersActions = new Map<string, Set<PermissionAction>>()
  const indicateursActions = new Map<string, Set<PermissionAction>>()

  for (const perm of panierPerms) {
    addAction(paniersActions, perm.panier.publicId, perm.action)
    // Propagation : READ ou WRITE panier → READ sur chaque indicateur lié.
    for (const link of perm.panier.indicateurs) {
      addAction(indicateursActions, link.indicateur.publicId, PermissionAction.READ)
    }
  }
  for (const perm of indicateurPerms) {
    addAction(indicateursActions, perm.indicateur.publicId, perm.action)
  }

  return {
    paniers: serialize(paniersActions),
    indicateurs: serialize(indicateursActions),
  }
}

const addAction = (
  map: Map<string, Set<PermissionAction>>,
  publicId: string,
  action: PermissionAction,
): void => {
  const set = map.get(publicId) ?? new Set<PermissionAction>()
  set.add(action)
  map.set(publicId, set)
}

const serialize = (map: Map<string, Set<PermissionAction>>): PermissionEntry[] =>
  Array.from(map.entries())
    .map(([id, actions]) => ({
      id,
      actions: ACTION_ORDER.filter((a) => actions.has(a)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
