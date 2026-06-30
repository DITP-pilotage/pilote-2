import { type MePermissionsApiModel } from '@pilote/mb-shared/mePermissions'
import { okAsync, ResultAsync } from 'neverthrow'

import { requirePrincipal } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ApiKeyRole, PermissionAction } from '@/generated/prisma/enums'

type PermissionEntry = MePermissionsApiModel['paniers'][number]

const ACTION_ORDER: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

// READ panier (direct ou WRITE) propage en READ sur les indicateurs du panier.
// WRITE indicateur reste strictement direct — cf. permissions-design.md.
export const listerMesPermissions = (): ResultAsync<MePermissionsApiModel, never> => {
  const principal = requirePrincipal()

  if (principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.ADMIN) {
    return okAsync({ isAdmin: true, paniers: [], indicateurs: [] })
  }

  const principalId = principal.kind === 'user' ? principal.user.id : principal.apiKey.id

  return ResultAsync.fromSafePromise(loadPermissions(principalId)).map(buildResponse)
}

const loadPermissions = async (principalId: string) => {
  const [panierPerms, indicateurPerms] = await Promise.all([
    db().panierPermission.findMany({
      where: { principalId },
      include: { panier: { select: { publicId: true } } },
    }),
    db().indicateurPermission.findMany({
      where: { principalId },
      include: { indicateur: { select: { publicId: true } } },
    }),
  ])
  const panierIds = panierPerms.map((p) => p.panierId)
  const propagationLinks =
    panierIds.length === 0
      ? []
      : await db().panierIndicateur.findMany({
          where: { panierId: { in: panierIds } },
          include: { indicateur: { select: { publicId: true } } },
        })
  return { panierPerms, indicateurPerms, propagationLinks }
}

type LoadResult = Awaited<ReturnType<typeof loadPermissions>>

const buildResponse = ({
  panierPerms,
  indicateurPerms,
  propagationLinks,
}: LoadResult): MePermissionsApiModel => {
  const paniersActions = new Map<string, Set<PermissionAction>>()
  const indicateursActions = new Map<string, Set<PermissionAction>>()

  for (const perm of panierPerms) {
    addAction(paniersActions, perm.panier.publicId, perm.action)
  }
  for (const perm of indicateurPerms) {
    addAction(indicateursActions, perm.indicateur.publicId, perm.action)
  }
  for (const link of propagationLinks) {
    addAction(indicateursActions, link.indicateur.publicId, PermissionAction.READ)
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
