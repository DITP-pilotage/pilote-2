import { createOpenAI } from '@ai-sdk/openai'
import { type Model } from '@pilote/kpilote-shared/assistant/chat'
import { generateText, Output, stepCountIs, type LanguageModel } from 'ai'
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
