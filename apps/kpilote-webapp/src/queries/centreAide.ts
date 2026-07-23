import { queryOptions } from '@tanstack/react-query'

import { fetchArticlesCentreAidePublies } from '@/api/centreAide'

export const articlesCentreAidePubliesQueryOptions = () =>
  queryOptions({
    queryKey: ['centre-aide', 'public'],
    queryFn: () => fetchArticlesCentreAidePublies(),
  })
