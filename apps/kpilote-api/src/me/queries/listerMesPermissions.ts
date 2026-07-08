import { type MePermissionsApiModel } from '@pilote/kpilote-shared/mePermissions'
import { okAsync, ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type PermissionEntry = MePermissionsApiModel['dossiers'][number]

const ACTION_ORDER: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

// READ dossier (direct ou WRITE) propage en READ sur les indicateurs du dossier.
// WRITE indicateur reste strictement direct — cf. permissions-design.md.
export const listerMesPermissions = (): ResultAsync<MePermissionsApiModel, never> => {
  if (isAdminPrincipal()) {
    return okAsync({ isAdmin: true, dossiers: [], indicateurs: [] })
  }

  return ResultAsync.fromSafePromise(loadPermissions(requireCurrentPrincipalId())).map(
    buildResponse,
  )
}

const loadPermissions = (principalId: string) =>
  Promise.all([
    db().dossierPermission.findMany({
      where: { principalId },
      include: {
        dossier: {
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

const buildResponse = ([dossierPerms, indicateurPerms]: LoadResult): MePermissionsApiModel => {
  const dossiersActions = new Map<string, Set<PermissionAction>>()
  const indicateursActions = new Map<string, Set<PermissionAction>>()

  for (const perm of dossierPerms) {
    addAction(dossiersActions, perm.dossier.publicId, perm.action)
    // Propagation : READ ou WRITE dossier → READ sur chaque indicateur lié.
    for (const link of perm.dossier.indicateurs) {
      addAction(indicateursActions, link.indicateur.publicId, PermissionAction.READ)
    }
  }
  for (const perm of indicateurPerms) {
    addAction(indicateursActions, perm.indicateur.publicId, perm.action)
  }

  return {
    dossiers: serialize(dossiersActions),
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
