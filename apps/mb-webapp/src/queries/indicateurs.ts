import { type IndicateurPublicId } from '@pilote/mb-shared/api'
import { queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  type IndicateursQueryParams,
} from '@/api/indicateurs'

import { DEFAULT_STALE_TIME } from './utils'

export const indicateursQueryOptions = (params: IndicateursQueryParams) =>
  queryOptions({
    queryKey: ['indicateurs', params],
    queryFn: () => fetchIndicateurs(params),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurQueryOptions = (id: IndicateurPublicId) =>
  queryOptions({
    queryKey: ['indicateur', id],
    queryFn: () => fetchIndicateurById(id),
    staleTime: DEFAULT_STALE_TIME,
  })
