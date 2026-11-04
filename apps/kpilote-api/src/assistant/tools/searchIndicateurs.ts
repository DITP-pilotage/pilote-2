import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { findIndicateurNames } from '@/assistant/tools/search/nameQueries'
import {
  createRanker,
  MAX_RESULTS,
  searchEntities,
  TERM_PAGE_SIZE,
} from '@/assistant/tools/search/searchEntities'

export const searchIndicateurs: ToolDefinition<'search_indicateurs'> = {
  description: `Renvoie au plus ${MAX_RESULTS} indicateurs (identifiant et nom) qui correspondent à une formulation libre : thématique, acronyme, libellé approximatif.
- \`needsClarification\` : la recherche n'a pas pu conclure ; rapporte-le à l'utilisateur.
Utilise-le pour : retrouver l'identifiant d'un indicateur que l'utilisateur désigne par ses mots (« l'indicateur sur la fraude fiscale »).
Ne l'utilise pas pour : un identifiant déjà donné (IND-42) → get_synthese_indicateur ; une collection → search_collections.`,
  execute: ({ query }, { abortSignal, context }) =>
    searchEntities({
      query,
      filterByTerm: (term) => findIndicateurNames({ term, limit: TERM_PAGE_SIZE }),
      loadCatalog: (limit) => findIndicateurNames({ limit }),
      rank: createRanker({
        name: 'search_indicateurs.ranking',
        context,
        ...(abortSignal ? { abortSignal } : {}),
      }),
    }),
}
