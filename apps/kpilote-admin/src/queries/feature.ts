import { queryOptions } from '@tanstack/react-query'

import { fetchFeatureFlippingById, fetchFeatureFlippings } from '@/api/featureFlipping'

export const featureFlippingsQueryOptions = () =>
  queryOptions({
    queryKey: ['feature-flipping'],
    queryFn: () => fetchFeatureFlippings(),
  })

export const featureFlippingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['feature-flipping', id],
    queryFn: () => fetchFeatureFlippingById(id),
  })
