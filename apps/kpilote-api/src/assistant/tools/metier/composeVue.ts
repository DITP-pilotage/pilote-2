import {
  inputComposeVueSchema,
  type ComposeVueOutput,
} from '@pilote/kpilote-shared/assistant/tools'
import { vueSchema, type Vue } from '@pilote/kpilote-shared/assistant/vignettes'
import { generateText, Output, stepCountIs, tool, type Tool } from 'ai'

import { creerModeleAssistant, TEMPERATURE_STRUCTUREE } from '@/assistant/runtime/modele'
import {
  DESCRIPTION_COMPOSE_VUE,
  PROMPT_SOUS_AGENT,
} from '@/assistant/tools/metier/composeVuePrompt'
import { validerVue, type ContexteVue } from '@/assistant/tools/metier/validerVue'
import { logger } from '@/framework/logger/logger'

export type Compositeur = (prompt: string) => Promise<Vue>

/** Une seule relance : au-delà, on rend la main plutôt que de brûler des tours de l'agent. */
const MAX_TENTATIVES = 2

const construirePrompt = (
  demande: string,
  contexte: ContexteVue,
  anomalies: ReadonlyArray<string>,
): string => {
  const lignes = [
    demande,
    '',
    '<contexte>',
    `indicateurs: ${JSON.stringify(contexte.indicateurs)}`,
    `collections: ${JSON.stringify(contexte.collections)}`,
    `individus: ${JSON.stringify(contexte.individus)}`,
    `referentiels: ${JSON.stringify(contexte.referentiels)}`,
    '</contexte>',
  ]
  if (anomalies.length > 0) {
    lignes.push(
      '',
      'Ta proposition précédente a été rejetée :',
      ...anomalies.map((anomalie) => `- ${anomalie}`),
    )
  }
  return lignes.join('\n')
}

/**
 * Compose puis valide. ppg note qu'un retry consomme une étape de l'agent principal : on
 * relance une fois en nommant les anomalies, puis on rend une erreur lisible.
 */
export const composerVue = async ({
  demande,
  indicateurs,
  collections,
  individus,
  referentiels,
  composer,
}: ContexteVue & { demande: string; composer: Compositeur }): Promise<ComposeVueOutput> => {
  const contexte: ContexteVue = { indicateurs, collections, individus, referentiels }
  let anomalies: string[] = []

  for (let tentative = 0; tentative < MAX_TENTATIVES; tentative += 1) {
    const vue = await composer(construirePrompt(demande, contexte, anomalies))
    anomalies = validerVue(vue, contexte)
    if (anomalies.length === 0) return vue

    logger.info(
      { event: 'assistant.composeVue.rejet', tentative: tentative + 1, anomalies },
      'Composition de vue rejetée',
    )
  }

  return {
    erreur: `La vue n'a pas pu être composée : ${anomalies.join(' ')} Explique à l'utilisateur que l'affichage a échoué et propose de reformuler.`,
  }
}

export const creerCompositeurLlm =
  (abortSignal?: AbortSignal): Compositeur =>
  async (prompt) => {
    const sortie = await generateText({
      model: creerModeleAssistant(),
      system: PROMPT_SOUS_AGENT,
      prompt,
      output: Output.object({ schema: vueSchema }),
      stopWhen: stepCountIs(3),
      temperature: TEMPERATURE_STRUCTUREE,
      // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
      ...(abortSignal ? { abortSignal } : {}),
    })
    return sortie.output
  }

export const creerComposeVueTool = (): Tool =>
  tool({
    description: DESCRIPTION_COMPOSE_VUE,
    inputSchema: inputComposeVueSchema,
    execute: (entree, { abortSignal }): Promise<ComposeVueOutput> =>
      composerVue({ ...entree, composer: creerCompositeurLlm(abortSignal) }),
  })
