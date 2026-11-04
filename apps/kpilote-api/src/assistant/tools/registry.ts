import {
  TOOL_NAMES,
  TOOLS,
  type ToolError,
  type ToolName,
} from '@pilote/kpilote-shared/assistant/tools'
import { tool, type Tool, type ToolSet } from 'ai'

import { clarifyWithChoices } from '@/assistant/tools/clarifyWithChoices'
import { getEvolutionIndicateur } from '@/assistant/tools/getEvolutionIndicateur'
import { getSyntheseCollection } from '@/assistant/tools/getSyntheseCollection'
import { getSyntheseIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { searchIndividus } from '@/assistant/tools/searchIndividus'
import { searchCollections } from '@/assistant/tools/searchCollections'
import { searchIndicateurs } from '@/assistant/tools/searchIndicateurs'
import {
  type AnyToolDefinition,
  type ToolContext,
  type ToolDefinition,
} from '@/assistant/tools/toolDefinition'
import { AppError } from '@/framework/errors/AppError'
import { logger } from '@/framework/logger/logger'

export type { ToolContext, ToolDefinition } from '@/assistant/tools/toolDefinition'

const notImplemented = <N extends ToolName>(name: N): ToolDefinition<N> => ({
  description: name,
  execute: () => Promise.reject(new Error(`${name} : non implémenté`)),
})

const TOOL_DEFINITIONS: { [N in ToolName]: ToolDefinition<N> } = {
  search_indicateurs: searchIndicateurs,
  search_collections: searchCollections,
  search_individus: searchIndividus,
  get_synthese_indicateur: getSyntheseIndicateur,
  get_synthese_collection: getSyntheseCollection,
  get_evolution_indicateur: getEvolutionIndicateur,
  get_commentaires: notImplemented('get_commentaires'),
  clarify_with_choices: clarifyWithChoices,
}

export const REPEATED_FAILURE: ToolError = {
  error:
    "Cet appel a déjà échoué dans ce tour avec exactement ces paramètres. Ne le répète pas : corrige les paramètres d'après l'erreur précédente, ou explique à l'utilisateur ce qui bloque.",
}

const isToolError = (output: unknown): output is ToolError =>
  typeof output === 'object' && output !== null && 'error' in output

// Les erreurs du SDK portent le prompt et la réponse du modèle : on ne journalise que
// leur nom, leur message et leur pile.
export const toLoggableError = (error: unknown) =>
  error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { name: 'UnknownError', message: String(error) }

// Seules les erreurs métier disent au modèle quoi corriger. Une erreur interne (base,
// réseau) reste dans les journaux : sa sortie atteint aussi l'interface.
const describeFailure = (name: ToolName, error: unknown): ToolError => {
  if (error instanceof AppError) return { error: `L'appel a échoué : ${error.message}` }
  logger.error(
    { event: 'assistant.outil.erreur', tool: name, err: toLoggableError(error) },
    'Outil en erreur',
  )
  return { error: "L'appel a échoué suite à une erreur interne." }
}

/**
 * L'enveloppe commune : exécution sous le principal capturé, mémoire des appels échoués à
 * l'identique (construite par tour), et une erreur lisible plutôt qu'un tour qui tombe.
 * Le SDK valide l'entrée avec le schéma du contrat avant d'appeler `execute`.
 */
export const toAiTool = (
  name: ToolName,
  definition: AnyToolDefinition,
  context: ToolContext,
): Tool => {
  const failed = new Set<string>()
  const toModelOutput = definition.toModelOutput?.bind(definition)

  return tool({
    description: definition.description,
    inputSchema: TOOLS[name].input,
    execute: async (
      input: unknown,
      { abortSignal }: { abortSignal?: AbortSignal | undefined },
    ): Promise<unknown> => {
      const key = JSON.stringify(input)
      if (failed.has(key)) return REPEATED_FAILURE
      try {
        return await context.runInContext(() =>
          definition.execute(input, { ...(abortSignal ? { abortSignal } : {}), context }),
        )
      } catch (error) {
        failed.add(key)
        return describeFailure(name, error)
      }
    },
    ...(toModelOutput
      ? {
          toModelOutput: ({ output }: { output: unknown }) => ({
            type: 'json' as const,
            value: isToolError(output) ? output : toModelOutput(output),
          }),
        }
      : {}),
  })
}

export const buildTools = (context: ToolContext): ToolSet =>
  Object.fromEntries(
    TOOL_NAMES.map((name) => [name, toAiTool(name, TOOL_DEFINITIONS[name], context)]),
  )
