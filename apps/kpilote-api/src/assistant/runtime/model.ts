import { createOpenAI } from '@ai-sdk/openai'
import { type Model } from '@pilote/kpilote-shared/assistant/surfaces'
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'

/** Point de bascule unique quand un meilleur modèle Etalab arrive. */
export const DEFAULT_MODEL: Model = 'openweight-large'

export const CONVERSATION_TEMPERATURE = 0.2
export const STRUCTURED_TEMPERATURE = 0

/** ppg est à 50, ce qui laisse une conversation partir en vrille pendant cinquante tours. */
export const MAX_STEPS = 12

/** Nombre de candidats soumis au sous-modèle après pré-filtre déterministe. */
export const MAX_RANKING_CANDIDATES = 60

/** Taille au-delà de laquelle on refuse le repli sémantique plutôt que de tronquer. */
export const MAX_FALLBACK_CATALOG = 300

// Throw si la clé n'est pas configurée : c'est une erreur de déploiement (500), pas un
// état métier. Même parti pris que `valeurImport/helpers/albert.ts`.
export const createAssistantModel = (name: Model = DEFAULT_MODEL): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — assistant non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(name)
}
