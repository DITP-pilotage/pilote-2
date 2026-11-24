import {
  planImportEventSchema,
  type PlanImportEvent,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'

import { apiClient } from '@/api/client'
import { readSseJson } from '@/api/sse'

// Albert enchaîne plusieurs appels : la construction du plan peut prendre une à deux minutes.
const PLAN_IMPORT_TIMEOUT_MS = 180_000

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
  yield* readSseJson({ body: response.body, schema: planImportEventSchema })
}
