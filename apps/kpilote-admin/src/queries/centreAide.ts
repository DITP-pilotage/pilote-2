import { queryOptions } from '@tanstack/react-query'

import { fetchArticlesCentreAide } from '@/api/centreAide'

export const articlesCentreAideQueryOptions = () =>
  queryOptions({
    queryKey: ['centre-aide', 'articles'],
    queryFn: () => fetchArticlesCentreAide(),
  })
