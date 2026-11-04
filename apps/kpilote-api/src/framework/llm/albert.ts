import { createOpenAI } from '@ai-sdk/openai'
import { type Model } from '@pilote/kpilote-shared/assistant/chat'
import { generateText, Output, stepCountIs, streamText, type LanguageModel } from 'ai'
import { type z } from 'zod'

import { env } from '@/env'
import { type TurnTrace } from '@/framework/llm/turnTrace'
import { startTimer } from '@/framework/timer'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'

export const DEFAULT_MODEL: Model = 'openweight-large'
export const CONVERSATION_TEMPERATURE = 0.2
export const STRUCTURED_TEMPERATURE = 0

type ModelWrapper = (model: LanguageModel) => LanguageModel

let modelWrapper: ModelWrapper | null = null

/** Point d'accroche des evals et des tests : s'applique à tous les modèles, sous-agents compris. */
export const registerModelWrapper = (wrap: ModelWrapper | null): void => {
  modelWrapper = wrap
}

// Lève si la clé manque : c'est une erreur de déploiement (500), pas un état métier.
export const createAlbertModel = (model: Model = DEFAULT_MODEL): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — Albert non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  const languageModel = provider.chat(model)
  return modelWrapper ? modelWrapper(languageModel) : languageModel
}

export const generateStructured = async <T>({
  name,
  model,
  system,
  prompt,
  schema,
  trace,
  abortSignal,
}: {
  name: string
  model: Model
  system: string
  prompt: string
  schema: z.ZodType<T>
  trace: TurnTrace | null
  abortSignal?: AbortSignal
}): Promise<T> => {
  const elapsed = startTimer()
  const result = await generateText({
    model: createAlbertModel(model),
    system,
    prompt,
    output: Output.object({ schema }),
    stopWhen: stepCountIs(3),
    temperature: STRUCTURED_TEMPERATURE,
    ...(abortSignal ? { abortSignal } : {}),
  })
  // `usage` cumule les étapes ; la dernière porte l'usage de l'appel qui a produit la sortie.
  const lastUsage = result.steps.at(-1)?.usage ?? result.usage
  trace?.record({
    name,
    model,
    inputTokens: lastUsage.inputTokens ?? 0,
    outputTokens: lastUsage.outputTokens ?? 0,
    durationMs: elapsed(),
  })
  return result.output
}

/** La rédaction d'un sous-agent, morceau par morceau ; l'usage est tracé une fois le texte fini. */
export async function* streamSubagentText({
  name,
  model,
  system,
  prompt,
  trace,
  abortSignal,
}: {
  name: string
  model: Model
  system: string
  prompt: string
  trace: TurnTrace | null
  abortSignal?: AbortSignal
}): AsyncGenerator<string> {
  const elapsed = startTimer()
  const result = streamText({
    model: createAlbertModel(model),
    system,
    prompt,
    temperature: CONVERSATION_TEMPERATURE,
    ...(abortSignal ? { abortSignal } : {}),
  })
  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') yield part.text
    if (part.type === 'error') throw part.error
    if (part.type === 'abort') throw new Error('La rédaction du sous-agent a été interrompue')
  }
  const usage = await result.totalUsage
  trace?.record({
    name,
    model,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    durationMs: elapsed(),
  })
}
