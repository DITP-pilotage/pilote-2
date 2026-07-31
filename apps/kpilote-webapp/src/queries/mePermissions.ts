import {
  type MePermissionsApiModel,
  type PermissionEntryApiModel,
} from '@pilote/kpilote-shared/mePermissions'
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

const hasAction =
  (action: 'WRITE_DATA' | 'WRITE_COMMENT') =>
  (entries: PermissionEntryApiModel[], publicId: string): boolean =>
    entries.some((entry) => entry.id === publicId && entry.actions.includes(action))

const hasWriteData = hasAction('WRITE_DATA')
const hasWriteComment = hasAction('WRITE_COMMENT')

export const canWriteDataIndicateur = ({
  permissions,
  indicateurId,
}: {
  permissions: MePermissionsApiModel
  indicateurId: string
}): boolean => permissions.isAdmin === true || hasWriteData(permissions.indicateurs, indicateurId)

export const canWriteCommentIndicateur = ({
  permissions,
  indicateurId,
}: {
  permissions: MePermissionsApiModel
  indicateurId: string
}): boolean =>
  permissions.isAdmin === true || hasWriteComment(permissions.indicateurs, indicateurId)

// WRITE_COMMENT collection reste strictement direct (jamais propagé) — cf. me-permissions-design.md.
export const canWriteCommentCollection = ({
  permissions,
  collectionId,
}: {
  permissions: MePermissionsApiModel
  collectionId: string
}): boolean =>
  permissions.isAdmin === true || hasWriteComment(permissions.collections, collectionId)

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
