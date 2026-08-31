import { type Surface } from '@pilote/kpilote-shared/assistant/surfaces'

import { construireContexteRuntime } from '@/assistant/prompts/runtime'
import { SOCLE } from '@/assistant/prompts/socle'
import { ASK_LIBRE } from '@/assistant/prompts/surfaces/askLibre'

// `Record<Surface, string>` : ajouter une surface à SURFACES fait échouer la compilation
// ici tant qu'elle n'a pas sa couche de prompt. Le compilateur tient la liste de ce qui
// reste à faire — c'est ce qui remplace des fichiers de prompt écrits d'avance.
const PROMPTS_SURFACE: Record<Surface, string> = {
  'ask-libre': ASK_LIBRE,
}

export const construireSystemPrompt = ({
  surface,
  maintenant,
}: {
  surface: Surface
  maintenant: Date
}): string =>
  [SOCLE, PROMPTS_SURFACE[surface], construireContexteRuntime({ maintenant })].join('\n\n')
