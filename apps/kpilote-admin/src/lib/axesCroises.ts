import { type Arbre, type Fonction } from '@/lib/axeArbre'

export type AxeCroise = { id: string; nom: string; arbre: Arbre; fonction: Fonction }

// Une cellule : pour chaque axe déclaré, l'id d'une modalité ou de « Tous », dans l'ordre de
// déclaration.
export type CelluleIds = ReadonlyArray<string>

export type CelluleCroisee = {
  value: number | null
  statut: 'saisie' | 'absente' | 'calculee'
  present: number
  expected: number
  // Index de l'axe que le moteur a descendu pour calculer la cellule (null pour une saisie).
  axeDescendu: number | null
  enfants: ReadonlyArray<CelluleIds>
}

export const celluleKey = (ids: CelluleIds) => ids.join('|')

const aggregate = ({
  values,
  fonction,
}: {
  values: ReadonlyArray<number>
  fonction: Fonction
}): number => {
  const sum = values.reduce((total, value) => total + value, 0)
  return fonction === 'SUM' ? sum : sum / values.length
}

const parseSaisie = (raw: string | undefined): number | null => {
  const normalized = raw?.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}

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
}) => {
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
    const axeDescendu = ids.findLastIndex(
      (id, index) => (axes[index]?.arbre.get(id)?.children.length ?? 0) > 0,
    )
    if (axeDescendu === -1) {
      const value = parseSaisie(saisies[celluleKey(ids)])
      if (value === null) {
        return { value, statut: 'absente', present: 0, expected: 0, axeDescendu: null, enfants: [] }
      }
      return { value, statut: 'saisie', present: 1, expected: 1, axeDescendu: null, enfants: [] }
    }
    const axe = axes[axeDescendu]
    const node = axe?.arbre.get(ids[axeDescendu] ?? '')
    const enfants = (node?.children ?? []).map((child) =>
      ids.map((id, index) => (index === axeDescendu ? child : id)),
    )
    const observes = enfants.map(resolve).filter((enfant) => enfant.statut !== 'absente')
    const values = observes.flatMap((enfant) => (enfant.value === null ? [] : [enfant.value]))
    if (observes.length === 0) {
      return { value: null, statut: 'absente', present: 0, expected: 0, axeDescendu, enfants }
    }
    return {
      value: values.length === 0 ? null : aggregate({ values, fonction: axe?.fonction ?? 'SUM' }),
      statut: 'calculee',
      present: values.length,
      expected: observes.length,
      axeDescendu,
      enfants,
    }
  }

  return resolve
}

const leavesOf = (arbre: Arbre) =>
  [...arbre.values()].filter((node) => node.kind === 'feuille').map((node) => node.id)

const seededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

// Plafond de l'exemple : au-delà, le produit des feuilles devient illisible et coûteux.
const MAX_COMBINAISONS = 20_000

// Un cube creux d'exemple : une partie des combinaisons de feuilles n'est jamais saisie.
export const buildExempleCroise = ({
  axes,
  seed = 1,
}: {
  axes: ReadonlyArray<AxeCroise>
  seed?: number
}): Record<string, string> => {
  const random = seededRandom(seed)
  const combinaisons = axes.reduce<string[][]>(
    (acc, axe) => {
      const feuilles = leavesOf(axe.arbre)
      if (feuilles.length === 0 || acc.length * feuilles.length > MAX_COMBINAISONS) return acc
      return acc.flatMap((prefix) => feuilles.map((feuille) => [...prefix, feuille]))
    },
    [[]],
  )
  if (combinaisons[0]?.length !== axes.length) return {}
  return Object.fromEntries(
    combinaisons
      .filter(() => random() > 0.25)
      .map((ids) => [celluleKey(ids), String(Math.round(random() * 80 + 10))]),
  )
}
