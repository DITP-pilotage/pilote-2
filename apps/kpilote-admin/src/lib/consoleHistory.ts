import { consoleRequestSchema, httpMethodSchema } from '@pilote/kpilote-shared/console'
import { z } from 'zod'

const STORAGE_KEY = 'kpiloteadmin_console_history'
const MAX_ENTRIES = 20

const historyEntrySchema = z.object({
  id: z.string(),
  method: httpMethodSchema,
  path: z.string(),
  status: z.number(),
  ts: z.number(),
  request: consoleRequestSchema,
})
export type HistoryEntry = z.infer<typeof historyEntrySchema>

const historySchema = z.array(historyEntrySchema)

export const loadHistory = (): HistoryEntry[] => {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    // Sortie type-safe du localStorage : tout ce qui ne matche pas le schéma
    // (ancienne version, données corrompues) est ignoré silencieusement.
    const parsed = historySchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
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
