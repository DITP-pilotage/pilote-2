import {
  consoleHeaderPairSchema,
  httpMethodSchema,
  type ConsoleRequest,
} from '@pilote/kpilote-shared/console'
import { z } from 'zod'

import { joinUrl, splitUrl } from '@/api/console'
import type { HistoryEntry } from '@/lib/consoleHistory'

// Modèle du formulaire : l'UI manipule une URL relative unique (`path`, qui peut
// contenir la querystring). L'enveloppe wire, elle, sépare chemin et query — la
// conversion se fait au submit (toConsoleRequest) et à la restauration (valuesFromHistory).
export const consoleFormSchema = z.object({
  method: httpMethodSchema,
  path: z.string(),
  headers: z.array(consoleHeaderPairSchema),
  body: z.string(),
})
export type ConsoleFormValues = z.infer<typeof consoleFormSchema>

export const emptyConsoleForm: ConsoleFormValues = {
  method: 'GET',
  path: '',
  headers: [],
  body: '',
}

export const toConsoleRequest = (values: ConsoleFormValues): ConsoleRequest => {
  const { path, query } = splitUrl(values.path)
  return { method: values.method, path, query, headers: values.headers, body: values.body }
}

export const valuesFromHistory = (entry: HistoryEntry): ConsoleFormValues => ({
  method: entry.request.method,
  path: joinUrl({ path: entry.request.path, query: entry.request.query }),
  headers: entry.request.headers,
  body: entry.request.body,
})
