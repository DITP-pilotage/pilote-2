type GeoJsonFeature = {
  type: 'Feature'
  geometry: unknown
  properties: { code: string; nom: string }
}

export type FranceGeoJson = {
  type: 'FeatureCollection'
  features: ReadonlyArray<GeoJsonFeature>
}

const fetchGeoJson = async (url: string): Promise<FranceGeoJson> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Échec du chargement du GeoJSON (${response.status}): ${url}`)
  }
  return (await response.json()) as FranceGeoJson
}

export const fetchFranceDepartementsGeoJson = (): Promise<FranceGeoJson> =>
  fetchGeoJson('/maps/france-departements.json')

export const fetchFranceRegionsGeoJson = (): Promise<FranceGeoJson> =>
  fetchGeoJson('/maps/france-regions.json')
