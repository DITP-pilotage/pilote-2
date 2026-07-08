import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchAllUtilisateurs, fetchUtilisateurById, fetchUtilisateurs } from '@/api/utilisateurs'

export const utilisateursAllQueryOptions = () =>
  queryOptions({
    queryKey: ['utilisateurs', 'all-for-select'],
    queryFn: () => fetchAllUtilisateurs(),
  })

export const utilisateursInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['utilisateurs', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchUtilisateurs({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const utilisateurQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['utilisateur', id], queryFn: () => fetchUtilisateurById(id) })
