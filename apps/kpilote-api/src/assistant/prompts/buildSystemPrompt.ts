import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'

import { BASE_PROMPT } from '@/assistant/prompts/base'
import { buildRuntimeContext } from '@/assistant/prompts/runtime'
import { ASK_LIBRE } from '@/assistant/prompts/surfaces/askLibre'

/**
 * Une SURFACE est un point d'entrée de l'assistant, DÉCLARÉ par l'appelant : palette de
 * commandes, page d'indicateur, bouton de synthèse… Le moteur ne devine jamais l'intention
 * à partir du texte, il la reçoit.
 *
 * Chaque surface apporte sa politique de dialogue et de rendu, empilée sur le socle commun.
 * `Record<Surface, string>` : ajouter une surface à SURFACES fait échouer la compilation
 * ici tant qu'elle n'a pas sa couche de prompt. Le compilateur tient la liste de ce qui
 * reste à faire — c'est ce qui remplace des fichiers de prompt écrits d'avance.
 */
const SURFACE_PROMPTS: Record<Surface, string> = {
  'ask-libre': ASK_LIBRE,
}

export const buildSystemPrompt = ({ surface, now }: { surface: Surface; now: Date }): string =>
  [BASE_PROMPT, SURFACE_PROMPTS[surface], buildRuntimeContext({ now })].join('\n\n')
