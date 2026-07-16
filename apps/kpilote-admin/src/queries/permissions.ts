import { queryOptions } from '@tanstack/react-query'

import { fetchPrincipalPermissions } from '@/api/permissions'

export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
  })
