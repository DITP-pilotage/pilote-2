import { queryOptions } from '@tanstack/react-query'

import { fetchAnalyticsDimensions } from '@/api/analyticsDimensions'

export const ANALYTICS_DIMENSIONS_KEY = ['analytics', 'dimensions'] as const

export const analyticsDimensionsQueryOptions = () =>
  queryOptions({ queryKey: ANALYTICS_DIMENSIONS_KEY, queryFn: fetchAnalyticsDimensions })
