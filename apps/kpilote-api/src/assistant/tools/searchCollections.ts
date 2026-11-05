import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { findCollectionNames } from '@/assistant/tools/search/nameQueries'
import {
  createRanker,
  MAX_RESULTS,
  searchEntities,
  TERM_PAGE_SIZE,
} from '@/assistant/tools/search/searchEntities'

export const searchCollections: ToolDefinition<'search_collections'> = {
  description: `Renvoie au plus ${MAX_RESULTS} collections d'indicateurs (identifiant et nom) qui correspondent à une formulation libre.
- \`needsClarification\` : la recherche n'a pas pu conclure ; rapporte-le à l'utilisateur.
Utilise-le pour : retrouver une collection désignée par un thème ou un programme (« la collection sur la santé mentale »).
Ne l'utilise pas pour : un identifiant déjà donné (COL-7) → get_synthese_collection ; un indicateur → search_indicateurs.`,
  execute: ({ query }, { abortSignal, context }) =>
    searchEntities({
      query,
      filterByTerm: (term) => findCollectionNames({ term, limit: TERM_PAGE_SIZE }),
      loadCatalog: (limit) => findCollectionNames({ limit }),
      rank: createRanker({
        name: 'search_collections.ranking',
        context,
        ...(abortSignal ? { abortSignal } : {}),
      }),
    }),
}
