import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

export const parseSaisie = (raw: string | undefined): number | null => {
  const normalized = raw?.replace(',', '.').trim()
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}

export const aggregate = ({
  values,
  fonction,
}: {
  values: ReadonlyArray<number>
  fonction: FonctionAgregationAxe
}): number => {
  const sum = values.reduce((total, value) => total + value, 0)
  return fonction === 'SUM' ? sum : sum / values.length
}

// Générateur pseudo-aléatoire déterministe : le même axe donne toujours le même exemple.
export const seededRandom = (seed: number): (() => number) => {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}
