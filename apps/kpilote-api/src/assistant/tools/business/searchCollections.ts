import { searchInputSchema, type SearchOutput } from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool } from 'ai'

import {
  createLlmRanker,
  searchEntites,
  toFoundEntites,
} from '@/assistant/tools/business/searchIndicateurs'
import { listCollections } from '@/collection/queries/listCollections'

/** `pageSizeSchema` plafonne à 100 : ne jamais demander davantage. */
const PAGE_MAX = 100

const DESCRIPTION = `Identifie des collections (COL-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur évoque un regroupement d'indicateurs par son thème ou son intitulé approximatif, sans donner d'identifiant.

N'utilise PAS cet outil quand un COL-XXX explicite est fourni : appelle directement get_collection ou get_synthese_collection.

Renvoie au maximum 10 collections, avec leur identifiant et leur nom uniquement. Quand \`results\` est vide, \`reason\` explique pourquoi : rapporte-la à l'utilisateur.`

export const createSearchCollectionsTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: searchInputSchema,
    execute: async ({ query }, { abortSignal }): Promise<SearchOutput> =>
      searchEntites({
        query,
        filterByTerm: (term) =>
          listCollections({ recherche: term, pageSize: PAGE_MAX }).match(
            (data) => toFoundEntites(data.items),
            () => [],
          ),
        loadCatalog: () =>
          listCollections({ pageSize: PAGE_MAX }).match(
            (data) => toFoundEntites(data.items),
            () => [],
          ),
        rank: createLlmRanker(abortSignal),
      }),
  })
