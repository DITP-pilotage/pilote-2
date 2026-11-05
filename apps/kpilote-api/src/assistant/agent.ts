import { type Model, type PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { hasToolCall, stepCountIs, type StopCondition, type ToolSet } from 'ai'

import { resolvePageContext } from '@/assistant/context/resolvePageContext'
import { buildSystemPrompt } from '@/assistant/prompt/systemPrompt'
import { buildTools } from '@/assistant/tools/registry'
import { type RunInContext } from '@/framework/context/captureContext'
import { CONVERSATION_TEMPERATURE } from '@/framework/llm/albert'
import { type TurnTrace } from '@/framework/llm/turnTrace'

/** PPG s'arrête à 50 : assez pour qu'un tour parte en boucle avant de s'arrêter. */
export const MAX_STEPS = 15

export type AgentSetup = {
  system: string
  tools: ToolSet
  stopWhen: Array<StopCondition<ToolSet>>
  temperature: number
}

/**
 * Tout ce qui définit l'agent : prompt, outils, arrêt. La route et les evals passent par
 * ici, si bien qu'une eval mesure l'agent de production. Tous les outils sont exposés à
 * chaque tour : les filtrer selon la demande en retirait au mauvais moment (constat PPG).
 */
export const buildAgent = async ({
  pageContext,
  model,
  trace,
  runInContext,
}: {
  pageContext: PageContext | undefined
  model: Model
  trace: TurnTrace
  runInContext: RunInContext
}): Promise<AgentSetup> => ({
  system: buildSystemPrompt({
    now: new Date(),
    pageContext: await runInContext(() => resolvePageContext(pageContext)),
  }),
  tools: buildTools({ model, trace, runInContext }),
  // La question de précision clôt le tour : l'utilisateur choisit avant toute suite.
  stopWhen: [stepCountIs(MAX_STEPS), hasToolCall('clarify_with_choices')],
  temperature: CONVERSATION_TEMPERATURE,
})
