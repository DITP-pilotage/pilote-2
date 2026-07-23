import { useEffect } from 'react'

/** Type de ressource dont on mémorise la visite (fiche de détail). */
export type RecentType = 'indicateur' | 'collection' | 'article'

/** Une entrée « visité récemment » : de quoi reconstruire une commande de navigation. */
export type RecentEntry = {
  type: RecentType
  /** publicId de la ressource (ex: `IND-42`, `COL-01`). */
  id: string
  /** Libellé affiché (le nom au moment de la visite). */
  label: string
}

const STORAGE_KEY = 'kpilote:recently-visited'
const MAX_ENTRIES = 5

const entryKey = (entry: RecentEntry): string => `${entry.type}:${entry.id}`

/** Valide qu'une valeur inconnue a bien la forme d'une `RecentEntry`. */
function isRecentEntry(value: unknown): value is RecentEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    (entry.type === 'indicateur' ||
      entry.type === 'collection' ||
      entry.type === 'article') &&
    typeof entry.id === 'string' &&
    typeof entry.label === 'string'
  )
}

/** Lit la liste depuis localStorage, tolérante aux données corrompues / stockage indisponible. */
function read(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    // On filtre les entrées malformées pour tenir la promesse d'une lecture
    // tolérante : une entrée corrompue ne doit pas faire échouer `recordVisit()`.
    return parsed.filter(isRecentEntry).slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

/** Les 5 dernières fiches visitées, dédupliquées, la plus récente en tête. */
export function getRecentlyVisited(): RecentEntry[] {
  return read()
}

/**
 * Enregistre une visite : remonte l'entrée en tête, déduplique par `type:id`,
 * et tronque à 5. Échoue silencieusement si le stockage est indisponible
 * (navigation privée, quota) — la fonctionnalité est purement confort.
 */
export function recordVisit(entry: RecentEntry): void {
  const key = entryKey(entry)
  const next = [entry, ...read().filter((existing) => entryKey(existing) !== key)].slice(
    0,
    MAX_ENTRIES,
  )
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // stockage indisponible : on n'interrompt pas la navigation
  }
}

/**
 * Enregistre la fiche courante comme visitée. À appeler dans le composant d'une
 * route de détail, une fois l'entité chargée (on a alors son `id` et son `label`).
 */
export function useRecordVisit(entry: RecentEntry): void {
  const { type, id, label } = entry
  useEffect(() => {
    recordVisit({ type, id, label })
  }, [type, id, label])
}
