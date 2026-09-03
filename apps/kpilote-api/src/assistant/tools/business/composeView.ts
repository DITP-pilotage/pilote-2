import {
  composeViewInputSchema,
  type ComposeViewOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { viewSchema, type View } from '@pilote/kpilote-shared/assistant/tiles'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'

import { createAssistantModel, STRUCTURED_TEMPERATURE } from '@/assistant/runtime/model'
import {
  COMPOSE_VIEW_DESCRIPTION,
  SUBAGENT_PROMPT,
} from '@/assistant/tools/business/composeViewPrompt'
import { validateView, type ViewContext } from '@/assistant/tools/business/validateView'
import { logger } from '@/framework/logger/logger'

export type Composer = (prompt: string) => Promise<View>

/** Une seule relance : au-delà, on rend la main plutôt que de brûler des tours de l'agent. */
const MAX_ATTEMPTS = 2

const buildPrompt = (
  request: string,
  context: ViewContext,
  issues: ReadonlyArray<string>,
): string => {
  const lines = [
    request,
    '',
    '<contexte>',
    `indicateurs: ${JSON.stringify(context.indicateurs)}`,
    `collections: ${JSON.stringify(context.collections)}`,
    `individus: ${JSON.stringify(context.individus)}`,
    `referentiels: ${JSON.stringify(context.referentiels)}`,
    '</contexte>',
  ]
  if (issues.length > 0) {
    lines.push('', 'Ta proposition précédente a été rejetée :', ...issues.map((it) => `- ${it}`))
  }
  return lines.join('\n')
}

/**
 * Compose puis valide. ppg note qu'un retry consomme une étape de l'agent principal : on
 * relance une fois en nommant les anomalies, puis on rend une erreur lisible.
 */
export const composeView = async ({
  request,
  indicateurs,
  collections,
  individus,
  referentiels,
  compose,
}: ViewContext & { request: string; compose: Composer }): Promise<ComposeViewOutput> => {
  const context: ViewContext = { indicateurs, collections, individus, referentiels }
  let issues: string[] = []

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const view = await compose(buildPrompt(request, context, issues))
    issues = validateView(view, context)
    if (issues.length === 0) return view

    logger.info(
      { event: 'assistant.composeView.rejet', attempt: attempt + 1, issues },
      'Composition de vue rejetée',
    )
  }

  return {
    error: `La vue n'a pas pu être composée : ${issues.join(' ')} Explique à l'utilisateur que l'affichage a échoué et propose de reformuler.`,
  }
}

export const createLlmComposer =
  (abortSignal?: AbortSignal): Composer =>
  async (prompt) => {
    const output = await generateText({
      model: createAssistantModel(),
      system: SUBAGENT_PROMPT,
      prompt,
      output: Output.object({ schema: viewSchema }),
      stopWhen: stepCountIs(3),
      temperature: STRUCTURED_TEMPERATURE,
      // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
      ...(abortSignal ? { abortSignal } : {}),
    })
    return output.output
  }

export const createComposeViewTool = (): Tool =>
  tool({
    description: COMPOSE_VIEW_DESCRIPTION,
    inputSchema: composeViewInputSchema,
    execute: (input, { abortSignal }): Promise<ComposeViewOutput> =>
      composeView({ ...input, compose: createLlmComposer(abortSignal) }),
  })
