import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { aggregate, parseSaisie, seededRandom } from '@/lib/aggregation'
import { type Arbre, nodesOfKind } from '@/lib/axeArbre'

export type AxeCroise = { id: string; nom: string; arbre: Arbre; fonction: FonctionAgregationAxe }

// Une cellule : pour chaque axe déclaré, l'id d'une modalité ou de « Tous », dans l'ordre de
// déclaration.
export type CelluleIds = ReadonlyArray<string>

export type CelluleCroisee = {
  value: number | null
  statut: 'saisie' | 'absente' | 'calculee'
  present: number
  expected: number
  // Une feuille sur chaque axe : la seule cellule où l'on saisit.
  isSaisissable: boolean
  // Index de l'axe que le moteur a descendu pour calculer la cellule (null sans calcul).
  descendedAxe: number | null
  children: ReadonlyArray<CelluleIds>
}

export const celluleKey = (ids: CelluleIds): string => ids.join('|')

const absenteOf = ({
  isSaisissable,
  descendedAxe,
  children,
}: Pick<CelluleCroisee, 'isSaisissable' | 'descendedAxe' | 'children'>): CelluleCroisee => ({
  value: null,
  statut: 'absente',
  present: 0,
  expected: 0,
  isSaisissable,
  descendedAxe,
  children,
})

// Moteur de la spec multifiltre (§5, plusieurs axes) pour un individu saisi : tant qu'un axe
// reste à « Tous » ou sur une parente, on descend d'un niveau le dernier axe déclaré concerné,
// on ne garde que les combinaisons observées et on combine avec la fonction de cet axe. Le
// premier axe déclaré est donc combiné en premier, au plus près des saisies.
export const buildCroisement = ({
  axes,
  saisies,
}: {
  axes: ReadonlyArray<AxeCroise>
  saisies: Readonly<Record<string, string>>
}): ((ids: CelluleIds) => CelluleCroisee) => {
  const cache = new Map<string, CelluleCroisee>()

  const resolve = (ids: CelluleIds): CelluleCroisee => {
    const key = celluleKey(ids)
    const cached = cache.get(key)
    if (cached) return cached
    const cellule = compute(ids)
    cache.set(key, cellule)
    return cellule
  }

  const compute = (ids: CelluleIds): CelluleCroisee => {
    const descendedAxe = ids.findLastIndex(
      (id, index) => (axes[index]?.arbre.get(id)?.children.length ?? 0) > 0,
    )
    if (descendedAxe === -1) {
      // Un « Tous » sans enfant (axe sans modalité) n'est pas une feuille : rien n'y est saisi.
      const isSaisissable = ids.every((id, index) => axes[index]?.arbre.get(id)?.kind === 'feuille')
      const value = isSaisissable ? parseSaisie(saisies[celluleKey(ids)]) : null
      if (value === null) return absenteOf({ isSaisissable, descendedAxe: null, children: [] })
      return {
        value,
        statut: 'saisie',
        present: 1,
        expected: 1,
        isSaisissable,
        descendedAxe: null,
        children: [],
      }
    }
    const axe = axes[descendedAxe]
    const node = axe?.arbre.get(ids[descendedAxe] ?? '')
    const children = (node?.children ?? []).map((child) =>
      ids.map((id, index) => (index === descendedAxe ? child : id)),
    )
    const observed = children.map(resolve).filter((child) => child.statut !== 'absente')
    if (observed.length === 0) return absenteOf({ isSaisissable: false, descendedAxe, children })
    const values = observed.flatMap((child) => (child.value === null ? [] : [child.value]))
    return {
      value: values.length === 0 ? null : aggregate({ values, fonction: axe?.fonction ?? 'SUM' }),
      statut: 'calculee',
      present: values.length,
      expected: observed.length,
      isSaisissable: false,
      descendedAxe,
      children,
    }
  }

  return resolve
}

// Plafond de l'exemple : au-delà, on tire au hasard ce nombre de combinaisons de feuilles.
export const MAX_COMBINAISONS = 20_000

export const countCombinaisons = (axes: ReadonlyArray<AxeCroise>): number =>
  axes.reduce(
    (product, axe) => product * nodesOfKind({ arbre: axe.arbre, kind: 'feuille' }).length,
    1,
  )

const cartesian = (lists: ReadonlyArray<ReadonlyArray<string>>): string[][] =>
  lists.reduce<string[][]>(
    (prefixes, list) => prefixes.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  )

// Un cube creux d'exemple : une partie des combinaisons de feuilles n'est jamais saisie.
export const buildSampleCroise = ({
  axes,
  seed = 1,
  full = false,
}: {
  axes: ReadonlyArray<AxeCroise>
  seed?: number
  // Sans trou : toutes les combinaisons de feuilles ont une valeur (dans la limite du plafond).
  full?: boolean
}): Record<string, string> => {
  const random = seededRandom(seed)
  const feuillesByAxe = axes.map((axe) =>
    nodesOfKind({ arbre: axe.arbre, kind: 'feuille' }).map((node) => node.id),
  )
  const pick = (feuilles: ReadonlyArray<string>) =>
    feuilles[Math.floor(random() * feuilles.length)] ?? ''
  const combinaisons =
    countCombinaisons(axes) <= MAX_COMBINAISONS
      ? cartesian(feuillesByAxe)
      : Array.from({ length: MAX_COMBINAISONS }, () => feuillesByAxe.map(pick))
  return Object.fromEntries(
    combinaisons
      .filter(() => full || random() > 0.25)
      .map((ids) => [celluleKey(ids), String(Math.round(random() * 80 + 10))]),
  )
}

// Quel axe va en lignes, lequel en colonnes (null : une seule colonne de valeurs) ; les autres
// sont fixés sur une modalité.
export type Layout = { rows: number; columns: number | null }

// Choisir pour les lignes l'axe déjà en colonnes échange les deux.
export const withRowsAxe = ({ layout, index }: { layout: Layout; index: number }): Layout => {
  if (index === layout.columns) return { rows: index, columns: layout.rows }
  return { ...layout, rows: index }
}

// Choisir pour les colonnes l'axe des lignes échange les deux ; sans axe en colonnes, les lignes
// prennent un autre axe pour ne jamais croiser un axe avec lui-même.
export const withColumnsAxe = ({
  layout,
  index,
}: {
  layout: Layout
  index: number | null
}): Layout => {
  if (index !== layout.rows) return { ...layout, columns: index }
  const otherAxe = index === 0 ? 1 : 0
  return { rows: layout.columns ?? otherAxe, columns: index }
}
