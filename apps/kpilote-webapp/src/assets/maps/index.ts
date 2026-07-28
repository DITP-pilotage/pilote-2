import { type FranceGeoJson } from '@/api/geoJson'

import departements from './france-departements.json'
import departementsFrontieres from './france-departements-frontieres.json'
import regions from './france-regions.json'

// Cartes générées par `pnpm maps:generate` et importées statiquement (bundlées
// dans le chunk de la route via le code splitting). Déjà validées par le schéma
// à la génération, d'où le cast direct.
export const franceDepartementsGeoJson = departements as unknown as FranceGeoJson
export const franceRegionsGeoJson = regions as unknown as FranceGeoJson
export const franceDepartementsFrontieresGeoJson =
  departementsFrontieres as unknown as FranceGeoJson
