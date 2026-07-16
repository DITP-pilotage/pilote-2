import { type QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import { fetchMeFeature } from '@/api/meFeature'

import { DEFAULT_STALE_TIME } from './utils'

export const meFeatureQueryOptions = () =>
  queryOptions({
    queryKey: ['me', 'features'],
    queryFn: fetchMeFeature,
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadMeFeature = ({ queryClient }: { queryClient: QueryClient }) =>
  queryClient.ensureQueryData(meFeatureQueryOptions())

export const useFeature = (key: string): boolean => {
  const { data } = useSuspenseQuery(meFeatureQueryOptions())
  return data.features.includes(key)
}
