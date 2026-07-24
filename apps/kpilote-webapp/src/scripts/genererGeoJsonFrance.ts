import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { franceGeoJsonSchema } from '../api/geoJson'
import { convertirSvgEnGeoJson } from './svgVersGeoJson'

const ici = dirname(fileURLToPath(import.meta.url))
const racineKpilote = resolve(ici, '../..')
const racinePpg = resolve(ici, '../../../pilote-ppg')

type Territoire = { code: string; nomAffiché: string }

const chargerNoms = (): Record<string, string> => {
  const chemin = resolve(racinePpg, 'src/client/constants/territoires.json')
  const contenu = JSON.parse(readFileSync(chemin, 'utf8')) as { territoires: Territoire[] }
  const noms: Record<string, string> = {}
  for (const territoire of contenu.territoires) {
    noms[territoire.code] = territoire.nomAffiché
  }
  return noms
}

const lireMaxY = (svg: string): number => {
  const viewBox = svg.match(/viewBox="([^"]*)"/)?.[1]
  if (!viewBox) throw new Error('viewBox introuvable dans le SVG')
  const parties = viewBox.trim().split(/\s+/).map(Number)
  const minY = parties[1]
  const hauteur = parties[3]
  if (minY === undefined || hauteur === undefined) throw new Error('viewBox invalide')
  return minY + hauteur
}

const genererCarte = ({
  fichierSvg,
  prefixe,
  fichierSortie,
  noms,
}: {
  fichierSvg: string
  prefixe: string
  fichierSortie: string
  noms: Record<string, string>
}): void => {
  const svg = readFileSync(resolve(racinePpg, 'public/img', fichierSvg), 'utf8')
  const geoJson = convertirSvgEnGeoJson({ svg, prefixe, maxY: lireMaxY(svg), nomsParCode: noms })
  franceGeoJsonSchema.parse(geoJson)
  const chemin = resolve(racineKpilote, 'public/maps', fichierSortie)
  writeFileSync(chemin, JSON.stringify(geoJson))
  console.log(`${fichierSortie} : ${geoJson.features.length} territoires`)
}

const noms = chargerNoms()

genererCarte({
  fichierSvg: 'cartographie-vue-departements.svg',
  prefixe: 'DEPT-',
  fichierSortie: 'france-departements.json',
  noms,
})

genererCarte({
  fichierSvg: 'cartographie-vue-regions.svg',
  prefixe: 'REG-',
  fichierSortie: 'france-regions.json',
  noms,
})
