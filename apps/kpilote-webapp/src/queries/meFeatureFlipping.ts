import { type QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import { fetchMeFeatureFlipping } from '@/api/meFeatureFlipping'

import { DEFAULT_STALE_TIME } from './utils'

export const meFeatureFlippingQueryOptions = () =>
  queryOptions({
    queryKey: ['me', 'feature-flipping'],
    queryFn: fetchMeFeatureFlipping,
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadMeFeatureFlipping = ({ queryClient }: { queryClient: QueryClient }) =>
  queryClient.ensureQueryData(meFeatureFlippingQueryOptions())

export const useFeatureFlipping = (key: string): boolean => {
  const { data } = useSuspenseQuery(meFeatureFlippingQueryOptions())
  return data.features.includes(key)
}
