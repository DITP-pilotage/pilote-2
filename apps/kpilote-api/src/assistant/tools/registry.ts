// `@hono/zod-openapi` etend les schemas zod avec `.openapi()` AU MOMENT DE LEUR CREATION,
// pas retroactivement. Les modules de routes appellent `.openapi()` sur des schemas
// partages : si un autre import evalue `@pilote/kpilote-shared/*` avant que l'extension
// soit chargee, ces schemas ne l'ont pas et les routes echouent a l'evaluation.
//
// Ce module importe a la fois la chaine metier (qui atteint les schemas partages via les
// queries) et la whitelist (qui atteint les routes). Cet import de cote garantit l'ordre
// quel que soit le tri applique aux imports suivants.
import '@hono/zod-openapi'

import { type Model, type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import { type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import { type ToolSet } from 'ai'

import { createComposeViewTool } from '@/assistant/tools/business/composeView'
import { createGetSyntheseCollectionTool } from '@/assistant/tools/business/getSyntheseCollection'
import { createGetSyntheseIndicateurTool } from '@/assistant/tools/business/getSyntheseIndicateur'
import { createSearchCollectionsTool } from '@/assistant/tools/business/searchCollections'
import { createSearchIndicateursTool } from '@/assistant/tools/business/searchIndicateurs'
import { deriveTool } from '@/assistant/tools/deriveTool'
import { type Fetcher } from '@/assistant/tools/fetcher'
import { WHITELIST } from '@/assistant/tools/whitelist'

const TOOLS_BY_SURFACE: Record<Surface, ReadonlyArray<ToolName>> = {
  'ask-libre': [
    'search_indicateurs',
    'search_collections',
    'get_synthese_indicateur',
    'get_synthese_collection',
    'compose_view',
    ...WHITELIST.map((entry) => entry.name),
  ],
}

export const resolveTools = (surface: Surface, fetcher: Fetcher, model: Model): ToolSet => {
  const business: ToolSet = {
    search_indicateurs: createSearchIndicateursTool(),
    search_collections: createSearchCollectionsTool(),
    get_synthese_indicateur: createGetSyntheseIndicateurTool(fetcher),
    get_synthese_collection: createGetSyntheseCollectionTool(fetcher),
    compose_view: createComposeViewTool(model),
  }
  const derived: ToolSet = Object.fromEntries(
    WHITELIST.map((entry) => [entry.name, deriveTool(entry, fetcher)]),
  )

  const allowed = new Set<string>(TOOLS_BY_SURFACE[surface])
  return Object.fromEntries(
    Object.entries({ ...business, ...derived }).filter(([name]) => allowed.has(name)),
  )
}
