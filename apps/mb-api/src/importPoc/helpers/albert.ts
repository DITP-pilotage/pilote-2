import { createOpenAI } from '@ai-sdk/openai'
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'
const ALBERT_MODEL = 'openweight-large'

// Retourne null si ALBERT_API_KEY n'est pas configurée. La route POC doit
// court-circuiter avec un 503 avant d'appeler generateObject/generateText.
export const createAlbertModel = (): LanguageModel | null => {
  if (!env.ALBERT_API_KEY) return null
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(ALBERT_MODEL)
}

export const ALBERT_TEMPERATURE = 0
