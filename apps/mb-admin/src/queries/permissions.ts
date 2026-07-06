import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchIndicateurs } from '@/api/indicateurs'
import { fetchPaniers } from '@/api/paniers'
import { fetchPrincipalPermissions } from '@/api/permissions'

export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
  })

// `recherche` filtre sur le nom, `rechercheIdentifiant` sur l'identifiant public.
// Les deux factories normalisent la page vers `{ hits: { publicId, nom }[], pagination }`.

export const searchIndicateursInfiniteQueryOptions = (
  recherche: string,
  rechercheIdentifiant: string,
) =>
  infiniteQueryOptions({
    queryKey: ['indicateurs-search', { recherche, rechercheIdentifiant }],
    queryFn: async ({ pageParam }) => {
      const page = await fetchIndicateurs({
        recherche: recherche || undefined,
        rechercheIdentifiant: rechercheIdentifiant || undefined,
        cursor: pageParam ?? undefined,
      })
      return {
        hits: page.items.map((item) => ({ publicId: item.id, nom: item.nom })),
        pagination: page.pagination,
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const searchPaniersInfiniteQueryOptions = (
  recherche: string,
  rechercheIdentifiant: string,
) =>
  infiniteQueryOptions({
    queryKey: ['paniers-search', { recherche, rechercheIdentifiant }],
    queryFn: async ({ pageParam }) => {
      const page = await fetchPaniers({
        recherche: recherche || undefined,
        rechercheIdentifiant: rechercheIdentifiant || undefined,
        cursor: pageParam ?? undefined,
      })
      return {
        hits: page.items.map((item) => ({ publicId: item.id, nom: item.nom })),
        pagination: page.pagination,
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
