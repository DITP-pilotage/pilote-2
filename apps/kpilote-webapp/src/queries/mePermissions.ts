import {
  type MePermissionsApiModel,
  type CollectionPermissionEntryApiModel,
  type IndicateurPermissionEntryApiModel,
} from '@pilote/kpilote-shared/mePermissions'
import {
  CollectionPermissionAction,
  IndicateurPermissionAction,
  type CollectionPermissionActionValue,
  type IndicateurPermissionActionValue,
} from '@pilote/kpilote-shared/permission'
import { type QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import { fetchMePermissions } from '@/api/mePermissions'

import { DEFAULT_STALE_TIME } from './utils'

export const mePermissionsQueryOptions = () =>
  queryOptions({
    queryKey: ['me', 'permissions'],
    queryFn: fetchMePermissions,
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadMePermissions = ({ queryClient }: { queryClient: QueryClient }) =>
  queryClient.ensureQueryData(mePermissionsQueryOptions())

const hasIndicateurAction =
  (action: IndicateurPermissionActionValue) =>
  (entries: IndicateurPermissionEntryApiModel[], publicId: string): boolean =>
    entries.some((entry) => entry.id === publicId && entry.actions.includes(action))

const hasCollectionAction =
  (action: CollectionPermissionActionValue) =>
  (entries: CollectionPermissionEntryApiModel[], publicId: string): boolean =>
    entries.some((entry) => entry.id === publicId && entry.actions.includes(action))

const hasIndicateurWriteData = hasIndicateurAction(IndicateurPermissionAction.WRITE_DATA)
const hasIndicateurWriteComment = hasIndicateurAction(IndicateurPermissionAction.WRITE_COMMENT)
const hasCollectionWriteComment = hasCollectionAction(CollectionPermissionAction.WRITE_COMMENT)

export const canWriteDataIndicateur = ({
  permissions,
  indicateurId,
}: {
  permissions: MePermissionsApiModel
  indicateurId: string
}): boolean =>
  permissions.isAdmin === true || hasIndicateurWriteData(permissions.indicateurs, indicateurId)

export const canWriteCommentIndicateur = ({
  permissions,
  indicateurId,
}: {
  permissions: MePermissionsApiModel
  indicateurId: string
}): boolean =>
  permissions.isAdmin === true || hasIndicateurWriteComment(permissions.indicateurs, indicateurId)

// WRITE_COMMENT collection reste strictement direct (jamais propagé) — cf. me-permissions-design.md.
export const canWriteCommentCollection = ({
  permissions,
  collectionId,
}: {
  permissions: MePermissionsApiModel
  collectionId: string
}): boolean =>
  permissions.isAdmin === true || hasCollectionWriteComment(permissions.collections, collectionId)

export const useCanWriteDataIndicateur = (indicateurId: string): boolean => {
  const { data } = useSuspenseQuery(mePermissionsQueryOptions())
  return canWriteDataIndicateur({ permissions: data, indicateurId })
}

export const useCanWriteCommentIndicateur = (indicateurId: string): boolean => {
  const { data } = useSuspenseQuery(mePermissionsQueryOptions())
  return canWriteCommentIndicateur({ permissions: data, indicateurId })
}

export const useCanWriteCommentCollection = (collectionId: string): boolean => {
  const { data } = useSuspenseQuery(mePermissionsQueryOptions())
  return canWriteCommentCollection({ permissions: data, collectionId })
}
