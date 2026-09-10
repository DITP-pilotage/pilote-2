import {
  searchInputSchema,
  type FoundEntite,
  type SearchOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'
import { z } from 'zod'

import {
  createAssistantModel,
  MAX_FALLBACK_CATALOG,
  MAX_RANKING_CANDIDATES,
  STRUCTURED_TEMPERATURE,
} from '@/assistant/runtime/model'
import {
  filterHallucinations,
  rankByMatchedTerms,
  splitIntoTerms,
} from '@/assistant/tools/business/prefilter'
import { logger } from '@/framework/logger/logger'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'

/** `pageSizeSchema` plafonne à 100 : ne jamais demander davantage. */
const PAGE_MAX = 100

const MAX_RESULTS = 10

const rankingSchema = z.object({
  results: z
    .array(z.object({ id: z.string() }))
    .max(MAX_RESULTS)
    .describe('Identifiants retenus, du plus pertinent au moins pertinent.'),
})

export type Ranker = (
  query: string,
  candidates: ReadonlyArray<FoundEntite>,
) => Promise<ReadonlyArray<{ id: string }>>

/**
 * Résout un libellé approximatif en identifiants, en trois temps.
 *
 * 1. Pré-filtre déterministe par le filtre `recherche` de l'API, terme par terme.
 * 2. Court-circuit : zéro ou un candidat n'appelle pas le modèle.
 * 3. Classement par sous-modèle sur les candidats restants, puis filtrage anti-invention.
 *
 * Le repli sur catalogue complet existe parce que le pré-filtre est un `LIKE` : il échoue
 * sur les acronymes, précisément là où ppg brillait. On le borne et on le journalise plutôt
 * que d'en faire le cas nominal.
 */
export const searchEntites = async ({
  query,
  filterByTerm,
  loadCatalog,
  rank,
}: {
  query: string
  filterByTerm: (term: string) => Promise<FoundEntite[]>
  loadCatalog: () => Promise<FoundEntite[]>
  rank: Ranker
}): Promise<SearchOutput> => {
  const terms = splitIntoTerms(query)

  const filtered = terms.length === 0 ? [] : (await Promise.all(terms.map(filterByTerm))).flat()
  let candidates = rankByMatchedTerms(filtered, terms)
  let fallback = false

  if (candidates.length === 0) {
    const catalog = await loadCatalog()

    if (catalog.length > MAX_FALLBACK_CATALOG) {
      // Pas de troncature silencieuse : une liste coupée se lit comme « rien trouvé ».
      return {
        results: [],
        fallback: false,
        reason: `Le catalogue accessible est trop large (${catalog.length} entrées) pour une recherche exhaustive. Demande à l'utilisateur de préciser sa demande.`,
      }
    }

    if (catalog.length === 0) {
      return { results: [], fallback: false, reason: 'Aucune entité accessible.' }
    }

    fallback = true
    candidates = catalog
    logger.info(
      {
        event: 'assistant.recherche.repli',
        prefilterCandidates: 0,
        catalogSize: catalog.length,
      },
      'Recherche — repli sur le catalogue complet',
    )
  }

  const first = candidates[0]
  if (candidates.length === 1 && first) return { results: [first], fallback }

  const ranking = await rank(query, candidates.slice(0, MAX_RANKING_CANDIDATES))
  const results = filterHallucinations(ranking, candidates, (candidate) => candidate.id)

  return results.length === 0
    ? { results: [], fallback, reason: 'Aucune entité ne correspond à la demande.' }
    : { results, fallback }
}

const SYSTEM_PROMPT = `Tu reçois une requête utilisateur en langage naturel et une liste de candidats.
Ta tâche : renvoyer les identifiants des candidats qui correspondent à la requête, du plus pertinent au moins pertinent, au maximum ${MAX_RESULTS}.
Recopie les identifiants EXACTEMENT tels qu'ils apparaissent. N'en invente jamais.
Prends en compte les acronymes, les synonymes métier et les thématiques de politique publique.
Si aucun candidat ne correspond, renvoie une liste vide.`

export const createLlmRanker =
  (abortSignal?: AbortSignal): Ranker =>
  async (query, candidates) => {
    const output = await generateText({
      model: createAssistantModel(),
      system: SYSTEM_PROMPT,
      prompt: `${query}\n\n<candidats>\n${JSON.stringify(candidates)}\n</candidats>`,
      output: Output.object({ schema: rankingSchema }),
      stopWhen: stepCountIs(3),
      temperature: STRUCTURED_TEMPERATURE,
      // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
      ...(abortSignal ? { abortSignal } : {}),
    })
    return output.output.results
  }

const DESCRIPTION = `Identifie des indicateurs (IND-XXX) à partir d'une requête en langage naturel, quand l'utilisateur ne connaît pas leur identifiant.

Utilise cet outil quand l'utilisateur mentionne une thématique, un acronyme ou un libellé approximatif sans donner d'identifiant — « l'indicateur sur la fraude fiscale », « les délais de paiement ».

N'utilise PAS cet outil quand l'utilisateur a déjà fourni un IND-XXX explicite : appelle directement get_indicateur ou get_synthese_indicateur.

Renvoie au maximum ${MAX_RESULTS} indicateurs, avec leur identifiant et leur nom uniquement. Aucune donnée de valeur ou d'avancement — utilise les autres outils pour cela. Quand \`results\` est vide, \`reason\` explique pourquoi : rapporte-la à l'utilisateur.`

export const toFoundEntites = (items: ReadonlyArray<{ id: string; nom: string }>): FoundEntite[] =>
  items.map((item) => ({ publicId: item.id, nom: item.nom }))

export const createSearchIndicateursTool = (): Tool =>
  tool({
    description: DESCRIPTION,
    inputSchema: searchInputSchema,
    execute: async ({ query }, { abortSignal }): Promise<SearchOutput> =>
      searchEntites({
        query,
        // Les deux chargements passent par la query, donc par `withIndicateurReadPermission` :
        // le catalogue est déjà restreint à ce que le principal peut lire.
        filterByTerm: (term) =>
          listIndicateurs({ recherche: term, pageSize: PAGE_MAX }).match(
            (data) => toFoundEntites(data.items),
            () => [],
          ),
        loadCatalog: () =>
          listIndicateurs({ pageSize: PAGE_MAX }).match(
            (data) => toFoundEntites(data.items),
            () => [],
          ),
        rank: createLlmRanker(abortSignal),
      }),
  })
