import { queryOptions } from '@tanstack/react-query'

import { fetchArticlesCentreAide, fetchArticlesCentreAideCorbeille } from '@/api/centreAide'

export const articlesCentreAideQueryOptions = () =>
  queryOptions({
    queryKey: ['centre-aide', 'articles'],
    queryFn: () => fetchArticlesCentreAide(),
  })

export const articlesCentreAideCorbeilleQueryOptions = () =>
  queryOptions({
    queryKey: ['centre-aide', 'corbeille'],
    queryFn: () => fetchArticlesCentreAideCorbeille(),
  })
