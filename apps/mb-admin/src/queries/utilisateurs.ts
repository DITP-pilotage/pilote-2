import { queryOptions } from '@tanstack/react-query'

import { fetchUtilisateur, fetchUtilisateurs } from '@/api/utilisateurs'

export const utilisateursQueryOptions = () =>
  queryOptions({ queryKey: ['utilisateurs'], queryFn: fetchUtilisateurs })

export const utilisateurQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['utilisateurs', id], queryFn: () => fetchUtilisateur(id) })
