import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { findIndividuNames } from '@/assistant/tools/search/nameQueries'
import {
  createRanker,
  MAX_RESULTS,
  searchEntities,
  TERM_PAGE_SIZE,
} from '@/assistant/tools/search/searchEntities'

export const searchIndividus: ToolDefinition<'search_individus'> = {
  description: `Renvoie au plus ${MAX_RESULTS} individus (identifiant, nom et référentiel) qui correspondent à une formulation libre. Un individu est une entité d'un référentiel : un territoire, une académie, un bassin versant, un établissement…
- \`needsClarification\` : la recherche n'a pas pu conclure ; rapporte-le à l'utilisateur.
Utilise-le pour : trouver l'identifiant d'un individu nommé par l'utilisateur (« dans le Vaucluse », « pour l'académie de Lille »), avant de lire une synthèse ou une évolution.
Ne l'utilise pas pour : un individu déjà identifié dans la conversation ou le contexte de page ; un indicateur → search_indicateurs.`,
  execute: ({ query, referentielId }, { abortSignal, context }) =>
    searchEntities({
      query,
      filterByTerm: (term) =>
        findIndividuNames({
          term,
          limit: TERM_PAGE_SIZE,
          ...(referentielId ? { referentielId } : {}),
        }).then((page) => page.items),
      loadCatalog: (limit) =>
        findIndividuNames({ limit, ...(referentielId ? { referentielId } : {}) }),
      rank: createRanker({
        name: 'search_individus.ranking',
        context,
        ...(abortSignal ? { abortSignal } : {}),
      }),
    }),
}
