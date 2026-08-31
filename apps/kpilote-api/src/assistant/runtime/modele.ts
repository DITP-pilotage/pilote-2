import { createOpenAI } from '@ai-sdk/openai'
import { type Modele } from '@pilote/kpilote-shared/assistant/surfaces'
import { type LanguageModel } from 'ai'

import { env } from '@/env'

const ALBERT_BASE_URL = 'https://albert.api.etalab.gouv.fr/v1'

/** Point de bascule unique quand un meilleur modèle Etalab arrive. */
export const MODELE_PAR_DEFAUT: Modele = 'openweight-large'

export const TEMPERATURE_CONVERSATION = 0.2
export const TEMPERATURE_STRUCTUREE = 0

/** ppg est à 50, ce qui laisse une conversation partir en vrille pendant cinquante tours. */
export const MAX_ETAPES = 12

/** Nombre de candidats soumis au sous-modèle après pré-filtre déterministe. */
export const MAX_CANDIDATS_CLASSEMENT = 60

/** Taille au-delà de laquelle on refuse le repli sémantique plutôt que de tronquer. */
export const MAX_CATALOGUE_REPLI = 300

// Throw si la clé n'est pas configurée : c'est une erreur de déploiement (500), pas un
// état métier. Même parti pris que `valeurImport/helpers/albert.ts`.
export const creerModeleAssistant = (nom: Modele = MODELE_PAR_DEFAUT): LanguageModel => {
  if (!env.ALBERT_API_KEY) {
    throw new Error('ALBERT_API_KEY manquante — assistant non configuré côté API.')
  }
  const provider = createOpenAI({ baseURL: ALBERT_BASE_URL, apiKey: env.ALBERT_API_KEY })
  return provider.chat(nom)
}
