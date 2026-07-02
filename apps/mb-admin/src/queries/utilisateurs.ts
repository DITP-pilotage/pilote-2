import { queryOptions } from '@tanstack/react-query'

import { fetchUtilisateurs } from '@/api/utilisateurs'

export const utilisateursQueryOptions = () =>
  queryOptions({ queryKey: ['utilisateurs'], queryFn: fetchUtilisateurs })
