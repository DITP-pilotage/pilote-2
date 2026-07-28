import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { franceGeoJsonSchema } from '../api/geoJson'
import { construireFrontieresRegions } from './frontieresRegions'
import { convertirSvgEnGeoJson, type GeoJsonFeatureCollection } from './svgVersGeoJson'

const ici = dirname(fileURLToPath(import.meta.url))
const racineKpilote = resolve(ici, '../..')
const racinePpg = resolve(ici, '../../../pilote-ppg')

type Territoire = { code: string; nom: string; nomAffiché: string; codeParent: string | null }

const chargerTerritoires = (): Territoire[] => {
  const chemin = resolve(racinePpg, 'src/client/constants/territoires.json')
  const contenu = JSON.parse(readFileSync(chemin, 'utf8')) as { territoires: Territoire[] }
  return contenu.territoires
}

const territoires = chargerTerritoires()

const noms = territoires.reduce<Record<string, string>>((acc, territoire) => {
  acc[territoire.code] = territoire.nomAffiché
  return acc
}, {})

// Mapping code département (sans préfixe) → code région (sans préfixe).
const regionParDept = territoires.reduce<Record<string, string>>((acc, territoire) => {
  if (territoire.code.startsWith('DEPT-') && territoire.codeParent?.startsWith('REG-')) {
    acc[territoire.code.slice('DEPT-'.length)] = territoire.codeParent.slice('REG-'.length)
  }
  return acc
}, {})

// Nom lisible d'une région à partir de son code sans préfixe.
const nomParRegion = territoires.reduce<Record<string, string>>((acc, territoire) => {
  if (territoire.code.startsWith('REG-')) acc[territoire.code.slice('REG-'.length)] = territoire.nom
  return acc
}, {})

const lireMaxY = (svg: string): number => {
  const viewBox = svg.match(/viewBox="([^"]*)"/)?.[1]
  if (!viewBox) throw new Error('viewBox introuvable dans le SVG')
  const parties = viewBox.trim().split(/\s+/).map(Number)
  const minY = parties[1]
  const hauteur = parties[3]
  if (minY === undefined || hauteur === undefined) throw new Error('viewBox invalide')
  return minY + hauteur
}

const ecrire = (fichierSortie: string, geoJson: GeoJsonFeatureCollection): void => {
  franceGeoJsonSchema.parse(geoJson)
  writeFileSync(resolve(racineKpilote, 'src/assets/maps', fichierSortie), JSON.stringify(geoJson))
  console.log(`${fichierSortie} : ${geoJson.features.length} territoires`)
}

const convertir = (fichierSvg: string, prefixe: string): GeoJsonFeatureCollection => {
  const svg = readFileSync(resolve(racinePpg, 'public/img', fichierSvg), 'utf8')
  return convertirSvgEnGeoJson({ svg, prefixe, maxY: lireMaxY(svg), nomsParCode: noms })
}

const departements = convertir('cartographie-vue-departements.svg', 'DEPT-')
ecrire('france-departements.json', departements)

ecrire('france-regions.json', convertir('cartographie-vue-regions.svg', 'REG-'))

// Frontières de régions dérivées des départements (contours dissous), alignées
// sur la carte départements — sert d'overlay épais pour marquer les régions.
const regionDe = (codeDept: string): string => {
  const region = regionParDept[codeDept]
  if (!region) throw new Error(`Région introuvable pour le département ${codeDept}`)
  return region
}
const nomRegion = (codeRegion: string): string => nomParRegion[codeRegion] ?? codeRegion
ecrire(
  'france-departements-frontieres.json',
  construireFrontieresRegions({ departements, regionDe, nomRegion }),
)
