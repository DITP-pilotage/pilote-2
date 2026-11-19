import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { mapValues } from 'es-toolkit'

import { aggregate, parseSaisie, seededRandom } from '@/lib/aggregation'
import { type Arbre, nodesOfKind, TOUS_ID } from '@/lib/axeArbre'

export const PERIODES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin'] as const

// Saisies d'exemple : par feuille, la valeur saisie à chaque période ('' = rien de saisi).
export type SaisiesSerie = Record<string, ReadonlyArray<string>>

// - saisie : valeur saisie à cette période ;
// - reportee : rien de saisi, la dernière valeur connue est reportée ;
// - manquante : attendue (saisie à une autre période) mais pas encore de valeur ;
// - absente : jamais saisie, elle n'existe pas pour l'individu et sort du calcul ;
// - calculee : parente ou « Tous », agrégée depuis ses enfants.
export type CelluleStatut = 'saisie' | 'reportee' | 'manquante' | 'absente' | 'calculee'

export type Cellule = {
  value: number | null
  statut: CelluleStatut
  present: number
  expected: number
}

const ABSENTE: Cellule = { value: null, statut: 'absente', present: 0, expected: 0 }

const serieOfFeuille = (saisies: ReadonlyArray<string> | undefined): Cellule[] => {
  const values = PERIODES.map((_, index) => parseSaisie(saisies?.[index]))
  const isObserved = values.some((value) => value !== null)
  let last: number | null = null
  return values.map((value) => {
    if (value !== null) {
      last = value
      return { value, statut: 'saisie', present: 1, expected: 1 }
    }
    if (!isObserved) return ABSENTE
    if (last === null) return { value: null, statut: 'manquante', present: 0, expected: 1 }
    return { value: last, statut: 'reportee', present: 1, expected: 1 }
  })
}

const combineChildren = ({
  cellules,
  fonction,
}: {
  cellules: ReadonlyArray<Cellule>
  fonction: FonctionAgregationAxe
}): Cellule => {
  const expectedCellules = cellules.filter((cellule) => cellule.statut !== 'absente')
  if (expectedCellules.length === 0) return ABSENTE
  const values = expectedCellules.flatMap((cellule) =>
    cellule.value === null ? [] : [cellule.value],
  )
  return {
    value: values.length === 0 ? null : aggregate({ values, fonction }),
    statut: 'calculee',
    present: values.length,
    expected: expectedCellules.length,
  }
}

// Sémantique du moteur pour un individu saisi (spec multifiltre §5) : une modalité jamais
// saisie n'est pas attendue ; une modalité saisie une fois est attendue sur toute la période,
// manquante avant sa première valeur, reportée ensuite. Chaque niveau combine ses enfants
// attendus qui ont une valeur.
export const computeSerie = ({
  arbre,
  saisies,
  fonction,
}: {
  arbre: Arbre
  saisies: SaisiesSerie
  fonction: FonctionAgregationAxe
}): Map<string, Cellule[]> => {
  const result = new Map<string, Cellule[]>()
  const visit = (id: string): Cellule[] => {
    const node = arbre.get(id)
    if (!node) return []
    if (node.kind === 'feuille') {
      const serie = serieOfFeuille(saisies[id])
      result.set(id, serie)
      return serie
    }
    const childSeries = node.children.map(visit)
    const serie = PERIODES.map((_, index) =>
      combineChildren({
        cellules: childSeries.flatMap((childSerie) => childSerie[index] ?? []),
        fonction,
      }),
    )
    result.set(id, serie)
    return serie
  }
  visit(TOUS_ID)
  return result
}

// Une seule date : la même sémantique, où une feuille vide est absente et sort du calcul.
export const computeValeurs = ({
  arbre,
  saisies,
  fonction,
}: {
  arbre: Arbre
  saisies: Readonly<Record<string, string>>
  fonction: FonctionAgregationAxe
}): Map<string, Cellule> => {
  const serie = computeSerie({
    arbre,
    saisies: mapValues(saisies, (saisie) => [saisie]),
    fonction,
  })
  return new Map([...serie].map(([id, cellules]) => [id, cellules[0] ?? ABSENTE]))
}

// Un exemple qui montre tous les cas : des feuilles jamais saisies, d'autres qui démarrent en
// cours de période, et des trous comblés par le report.
export const buildSampleSaisies = ({
  arbre,
  seed = 1,
  full = false,
}: {
  arbre: Arbre
  seed?: number
  // Sans trou : chaque feuille a une valeur à chaque période.
  full?: boolean
}): SaisiesSerie => {
  const random = seededRandom(seed)
  return Object.fromEntries(
    nodesOfKind({ arbre, kind: 'feuille' }).map((feuille, rank) => {
      const isNeverSaisie = !full && rank > 0 && random() < 0.15
      if (isNeverSaisie) return [feuille.id, PERIODES.map(() => '')]
      const start = !full && random() < 0.3 ? 1 + Math.floor(random() * 3) : 0
      let value = Math.round(random() * 80 + 10)
      const serie = PERIODES.map((_, index) => {
        if (index < start) return ''
        if (!full && index > start && random() < 0.25) return ''
        value = Math.max(0, value + Math.round((random() - 0.4) * 12))
        return String(value)
      })
      return [feuille.id, serie]
    }),
  )
}

export const buildSampleValeurs = ({
  arbre,
  seed = 1,
  full = false,
}: {
  arbre: Arbre
  seed?: number
  full?: boolean
}): Record<string, string> => {
  const random = seededRandom(seed)
  return Object.fromEntries(
    nodesOfKind({ arbre, kind: 'feuille' }).map((feuille) => {
      const isEmpty = !full && random() < 0.2
      return [feuille.id, isEmpty ? '' : String(Math.round(random() * 90 + 10))]
    }),
  )
}
