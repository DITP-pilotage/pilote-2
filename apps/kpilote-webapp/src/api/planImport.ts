import {
  ciblesSaisieApiModelSchema,
  type CiblesSaisieApiModel,
  planImportEventSchema,
  type PlanImportEvent,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'

import { apiClient } from '@/api/client'

// Albert enchaîne plusieurs appels : la construction du plan peut prendre une à deux minutes.
const PLAN_IMPORT_TIMEOUT_MS = 180_000

const SSE_DATA_PREFIX = 'data:'

export async function fetchCiblesSaisie(indicateurId: string): Promise<CiblesSaisieApiModel> {
  const json = await apiClient.get(`indicateurs/${indicateurId}/cibles-saisie`).json()
  return ciblesSaisieApiModelSchema.parse(json)
}

// Découpe un flux d'octets en lignes de texte non vides.
export async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split(/\r?\n/)
      buffer = done ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        if (line.trim() !== '') yield line
      }
      if (done) return
    }
  } finally {
    reader.releaseLock()
  }
}

// Construction du plan de transformation par Albert : le serveur diffuse ses
// étapes, puis le plan ou l'échec. Une erreur HTTP est levée avant le flux.
export async function* streamPlanImport({
  indicateurId,
  tableau,
  nomFichier,
  signal,
}: {
  indicateurId: string
  tableau: TableauSource
  nomFichier: string
  signal?: AbortSignal
}): AsyncGenerator<PlanImportEvent> {
  const response = await apiClient.post(`indicateurs/${indicateurId}/valeurs:plan-import`, {
    json: { tableau, nomFichier },
    timeout: PLAN_IMPORT_TIMEOUT_MS,
    ...(signal ? { signal } : {}),
  })
  if (!response.body) return
  // Flux SSE : seules les lignes `data:` portent un événement.
  for await (const line of readLines(response.body)) {
    if (!line.startsWith(SSE_DATA_PREFIX)) continue
    yield planImportEventSchema.parse(JSON.parse(line.slice(SSE_DATA_PREFIX.length)))
  }
}
