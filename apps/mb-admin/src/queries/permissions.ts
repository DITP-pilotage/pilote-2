import type { PermissionResourceType } from '@pilote/mb-shared/permission'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchIndicateurs } from '@/api/indicateurs'
import { fetchPaniers } from '@/api/paniers'
import { fetchPrincipalPermissions } from '@/api/permissions'

export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
  })

// Recherche unifiée panier/indicateur : normalise les deux listes vers une page
// `{ publicId, nom }[]`, ce qui évite l'union de types incompatibles côté hook.
export const resourceSearchInfiniteQueryOptions = (
  resourceType: PermissionResourceType,
  recherche: string,
) =>
  infiniteQueryOptions({
    queryKey: ['resource-search', resourceType, { recherche }],
    queryFn: async ({ pageParam }) => {
      const params = { recherche: recherche || undefined, cursor: pageParam ?? undefined }
      const page =
        resourceType === 'PANIER' ? await fetchPaniers(params) : await fetchIndicateurs(params)
      return {
        hits: page.items.map((item) => ({ publicId: item.id, nom: item.nom })),
        pagination: page.pagination,
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
