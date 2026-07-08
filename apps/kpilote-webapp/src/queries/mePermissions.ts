import { type PermissionEntryApiModel } from '@pilote/kpilote-shared/mePermissions'
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

const hasWrite = (entries: PermissionEntryApiModel[], publicId: string): boolean =>
  entries.some((entry) => entry.id === publicId && entry.actions.includes('WRITE'))

export const useCanWriteIndicateur = (indicateurId: string): boolean => {
  const { data } = useSuspenseQuery(mePermissionsQueryOptions())
  return data.isAdmin === true || hasWrite(data.indicateurs, indicateurId)
}

// WRITE panier reste strictement direct (jamais propagé) — cf. me-permissions-design.md.
export const useCanWritePanier = (panierId: string): boolean => {
  const { data } = useSuspenseQuery(mePermissionsQueryOptions())
  return data.isAdmin === true || hasWrite(data.paniers, panierId)
}
