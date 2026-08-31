// `@hono/zod-openapi` etend les schemas zod avec `.openapi()` AU MOMENT DE LEUR CREATION,
// pas retroactivement. Les modules de routes appellent `.openapi()` sur des schemas
// partages : si un autre import evalue `@pilote/kpilote-shared/*` avant que l'extension
// soit chargee, ces schemas ne l'ont pas et les routes echouent a l'evaluation.
//
// Ce module importe a la fois la chaine metier (qui atteint les schemas partages via les
// queries) et la whitelist (qui atteint les routes). Cet import de cote garantit l'ordre
// quel que soit le tri applique aux imports suivants.
import '@hono/zod-openapi'

import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import { type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { type ToolSet } from 'ai'

import { deriverTool } from '@/assistant/tools/deriverTool'
import { creerComposeVueTool } from '@/assistant/tools/metier/composeVue'
import { creerGetSyntheseCollectionTool } from '@/assistant/tools/metier/getSyntheseCollection'
import { creerGetSyntheseIndicateurTool } from '@/assistant/tools/metier/getSyntheseIndicateur'
import { creerSearchCollectionsTool } from '@/assistant/tools/metier/searchCollections'
import { creerSearchIndicateursTool } from '@/assistant/tools/metier/searchIndicateurs'
import { type Requeteur } from '@/assistant/tools/requeteur'
import { WHITELIST } from '@/assistant/tools/whitelist'

const OUTILS_PAR_SURFACE: Record<Surface, ReadonlyArray<NomOutil>> = {
  'ask-libre': [
    'search_indicateurs',
    'search_collections',
    'get_synthese_indicateur',
    'get_synthese_collection',
    'compose_vue',
    ...WHITELIST.map((entree) => entree.nom),
  ],
}

export const resoudreOutils = (surface: Surface, requeteur: Requeteur): ToolSet => {
  const metier: ToolSet = {
    search_indicateurs: creerSearchIndicateursTool(),
    search_collections: creerSearchCollectionsTool(),
    get_synthese_indicateur: creerGetSyntheseIndicateurTool(requeteur),
    get_synthese_collection: creerGetSyntheseCollectionTool(requeteur),
    compose_vue: creerComposeVueTool(),
  }
  const derives: ToolSet = Object.fromEntries(
    WHITELIST.map((entree) => [entree.nom, deriverTool(entree, requeteur)]),
  )

  const autorises = new Set<string>(OUTILS_PAR_SURFACE[surface])
  return Object.fromEntries(
    Object.entries({ ...metier, ...derives }).filter(([nom]) => autorises.has(nom)),
  )
}
