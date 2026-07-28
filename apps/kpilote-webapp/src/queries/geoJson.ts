import { queryOptions } from '@tanstack/react-query'

import {
  fetchFranceDepartementsFrontieresGeoJson,
  fetchFranceDepartementsGeoJson,
  fetchFranceRegionsGeoJson,
} from '@/api/geoJson'

const GEOJSON_STALE_TIME = 24 * 60 * 60 * 1000

export const franceDepartementsGeoJsonQueryOptions = () =>
  queryOptions({
    queryKey: ['geoJson', 'france-departements'],
    queryFn: fetchFranceDepartementsGeoJson,
    staleTime: GEOJSON_STALE_TIME,
    gcTime: GEOJSON_STALE_TIME,
  })

export const franceRegionsGeoJsonQueryOptions = () =>
  queryOptions({
    queryKey: ['geoJson', 'france-regions'],
    queryFn: fetchFranceRegionsGeoJson,
    staleTime: GEOJSON_STALE_TIME,
    gcTime: GEOJSON_STALE_TIME,
  })

export const franceDepartementsFrontieresGeoJsonQueryOptions = () =>
  queryOptions({
    queryKey: ['geoJson', 'france-departements-frontieres'],
    queryFn: fetchFranceDepartementsFrontieresGeoJson,
    staleTime: GEOJSON_STALE_TIME,
    gcTime: GEOJSON_STALE_TIME,
  })
