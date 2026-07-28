import departements from './france-departements.json'
import departementsFrontieres from './france-departements-frontieres.json'
import { franceGeoJsonSchema } from './geoJson'
import regions from './france-regions.json'

// Cartes générées par `pnpm maps:generate` et importées statiquement (bundlées
// dans le chunk de la route via le code splitting). `parse` donne le type sans
// cast et valide la structure au chargement du chunk.
export const franceDepartementsGeoJson = franceGeoJsonSchema.parse(departements)
export const franceRegionsGeoJson = franceGeoJsonSchema.parse(regions)
export const franceDepartementsFrontieresGeoJson = franceGeoJsonSchema.parse(departementsFrontieres)
