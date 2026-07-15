import type { ConsoleRequest, HttpMethod } from '@/api/console'

const STORAGE_KEY = 'kpiloteadmin_console_history'
const MAX_ENTRIES = 20

export type HistoryEntry = {
  id: string
  method: HttpMethod
  path: string
  status: number
  ts: number
  request: ConsoleRequest
}

export const loadHistory = (): HistoryEntry[] => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export const pushHistory = (entry: HistoryEntry): HistoryEntry[] => {
  const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // best-effort : quota plein / stockage indisponible
  }
  return next
}

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // best-effort
  }
}
