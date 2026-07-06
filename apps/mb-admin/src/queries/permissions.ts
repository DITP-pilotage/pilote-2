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
// `recherche` filtre sur le nom, `rechercheIdentifiant` sur l'identifiant public.
export const resourceSearchInfiniteQueryOptions = (
  resourceType: PermissionResourceType,
  recherche: string,
  rechercheIdentifiant: string,
) =>
  infiniteQueryOptions({
    queryKey: ['resource-search', resourceType, { recherche, rechercheIdentifiant }],
    queryFn: async ({ pageParam }) => {
      const params = {
        recherche: recherche || undefined,
        rechercheIdentifiant: rechercheIdentifiant || undefined,
        cursor: pageParam ?? undefined,
      }
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
