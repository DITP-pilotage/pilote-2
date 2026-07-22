import { createOpenAI } from '@ai-sdk/openai'
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'
const ALBERT_MODEL = 'openweight-large'

// Throw si ALBERT_API_KEY n'est pas configurée : c'est une erreur de configuration
// déploiement (500), pas un état métier — inutile de la propager en Result à travers
// tous les calls. Le handler d'erreur global la remonte en 500.
export const createAlbertModel = (): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — Albert non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(ALBERT_MODEL)
}

export const ALBERT_TEMPERATURE = 0
