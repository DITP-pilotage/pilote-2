import { type NamedEntity, type SearchOutput } from '@pilote/kpilote-shared/assistant/tools'
import { z } from 'zod'

import { type ToolContext } from '@/assistant/tools/toolDefinition'
import {
  filterHallucinations,
  rankByMatchedTerms,
  splitIntoTerms,
} from '@/assistant/tools/search/prefilter'
import { generateStructured } from '@/framework/llm/albert'
import { logger } from '@/framework/logger/logger'

export const MAX_RESULTS = 10
export const MAX_RANKING_CANDIDATES = 60
export const MAX_FALLBACK_CATALOG = 300
/** Candidats lus par terme du pré-filtre. */
export const TERM_PAGE_SIZE = 100

export type Ranker = (
  query: string,
  candidates: ReadonlyArray<NamedEntity>,
) => Promise<ReadonlyArray<string>>

export type NamePage = { items: NamedEntity[]; total: number }

/**
 * Résout une formulation libre en entités, en trois temps : pré-filtre lexical en base,
 * court-circuit quand un seul candidat ressort, classement par sous-modèle sinon.
 *
 * Le repli sur le catalogue existe parce que le pré-filtre est un `contains` : il rate les
 * acronymes. Au-delà de la borne, on demande de préciser plutôt que de tronquer en silence :
 * une liste coupée se lirait comme « rien trouvé ».
 */
export const searchEntities = async ({
  query,
  filterByTerm,
  loadCatalog,
  rank,
}: {
  query: string
  filterByTerm: (term: string) => Promise<NamedEntity[]>
  loadCatalog: (limit: number) => Promise<NamePage>
  rank: Ranker
}): Promise<SearchOutput> => {
  const terms = splitIntoTerms(query)
  const filtered = (await Promise.all(terms.map(filterByTerm))).flat()
  let candidates = rankByMatchedTerms(filtered, terms)

  if (candidates.length === 0) {
    const catalog = await loadCatalog(MAX_FALLBACK_CATALOG)
    if (catalog.total > MAX_FALLBACK_CATALOG) {
      return {
        results: [],
        needsClarification: `Aucun nom ne contient ces termes, et le catalogue accessible compte ${catalog.total} entrées : trop pour une recherche exhaustive. Demande à l'utilisateur une formulation plus proche du libellé.`,
      }
    }
    if (catalog.items.length === 0) {
      return {
        results: [],
        needsClarification: "Aucune entité de ce type n'est accessible à l'utilisateur.",
      }
    }
    logger.info(
      { event: 'assistant.recherche.repli', catalogSize: catalog.items.length },
      'Recherche — repli sur le catalogue',
    )
    candidates = catalog.items
  }

  const [first] = candidates
  if (candidates.length === 1 && first) return { results: [first] }

  const ranked = await rank(query, candidates.slice(0, MAX_RANKING_CANDIDATES))
  const results = filterHallucinations(ranked, candidates).slice(0, MAX_RESULTS)
  return results.length === 0
    ? { results: [], needsClarification: 'Aucune entité ne correspond à la demande.' }
    : { results }
}

const RANKING_SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et une liste de candidats.
Renvoie les identifiants des candidats qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum ${MAX_RESULTS}.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent. N'en invente jamais.
Prends en compte les acronymes, les synonymes métier et les thématiques de politique publique.
Si aucun candidat ne correspond, renvoie une liste vide.`

const rankingSchema = z.object({
  ids: z.array(z.string()).describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

/** Classement sur le modèle du tour : comparer deux modèles compare tout l'échange. */
export const createRanker =
  ({
    name,
    context,
    abortSignal,
  }: {
    name: string
    context: ToolContext
    abortSignal?: AbortSignal
  }): Ranker =>
  async (query, candidates) => {
    const output = await generateStructured({
      name,
      model: context.model,
      system: RANKING_SYSTEM_PROMPT,
      prompt: `${query}\n\n<candidats>\n${JSON.stringify(candidates)}\n</candidats>`,
      schema: rankingSchema,
      trace: context.trace,
      ...(abortSignal ? { abortSignal } : {}),
    })
    return output.ids
  }
