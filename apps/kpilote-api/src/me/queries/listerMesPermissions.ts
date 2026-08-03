import { type MePermissionsApiModel } from '@pilote/kpilote-shared/mePermissions'
import { okAsync, ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  CollectionPermissionAction,
  IndicateurPermissionAction,
} from '@/generated/prisma/enums'
import { sortByOrder } from '@/permission/utils'

const INDICATEUR_ACTION_ORDER = [
  IndicateurPermissionAction.READ,
  IndicateurPermissionAction.WRITE_DATA,
  IndicateurPermissionAction.WRITE_COMMENT,
] as const

const COLLECTION_ACTION_ORDER = [
  CollectionPermissionAction.READ,
  CollectionPermissionAction.WRITE_COMMENT,
] as const

// READ collection (direct ou WRITE_COMMENT) propage en READ sur les indicateurs de la collection.
// WRITE_DATA et WRITE_COMMENT restent strictement directs — cf. permissions-design.md.
export const listerMesPermissions = (): ResultAsync<MePermissionsApiModel, never> => {
  if (isAdminPrincipal()) {
    return okAsync({ isAdmin: true, collections: [], indicateurs: [] })
  }

  return ResultAsync.fromSafePromise(loadPermissions(requireCurrentPrincipalId())).map(
    buildResponse,
  )
}

const loadPermissions = (principalId: string) =>
  Promise.all([
    db().collectionPermission.findMany({
      where: { principalId },
      include: {
        collection: {
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

const buildResponse = ([collectionPerms, indicateurPerms]: LoadResult): MePermissionsApiModel => {
  const collectionsActions = new Map<string, Set<CollectionPermissionAction>>()
  const indicateursActions = new Map<string, Set<IndicateurPermissionAction>>()

  for (const perm of collectionPerms) {
    addAction(collectionsActions, perm.collection.publicId, perm.action)
    // Propagation : READ ou WRITE collection → READ sur chaque indicateur lié.
    for (const link of perm.collection.indicateurs) {
      addAction(indicateursActions, link.indicateur.publicId, IndicateurPermissionAction.READ)
    }
  }
  for (const perm of indicateurPerms) {
    addAction(indicateursActions, perm.indicateur.publicId, perm.action)
  }

  return {
    collections: serializeMap(collectionsActions, COLLECTION_ACTION_ORDER),
    indicateurs: serializeMap(indicateursActions, INDICATEUR_ACTION_ORDER),
  }
}

const addAction = <T>(map: Map<string, Set<T>>, publicId: string, action: T): void => {
  const set = map.get(publicId) ?? new Set<T>()
  set.add(action)
  map.set(publicId, set)
}

const serializeMap = <T>(map: Map<string, Set<T>>, order: readonly T[]) =>
  Array.from(map.entries())
    .map(([id, actions]) => ({
      id,
      actions: sortByOrder([...actions], order),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
