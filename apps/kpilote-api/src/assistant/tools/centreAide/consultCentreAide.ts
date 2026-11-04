import { type CentreAideOutput } from '@pilote/kpilote-shared/assistant/tools'
import { z } from 'zod'

import { ANSWER_SYSTEM_PROMPT, SELECTION_SYSTEM_PROMPT } from '@/assistant/tools/centreAide/prompts'
import { listHelpPages, type HelpPage } from '@/assistant/tools/centreAide/sommaire'
import { type ToolDefinition } from '@/assistant/tools/toolDefinition'
import { generateStructured } from '@/framework/llm/albert'

export const MAX_HELP_PAGES = 3

// Sans `max` : un sous-agent qui renverrait une page de trop ferait échouer la validation.
// On tronque après filtrage.
const selectionSchema = z.object({ ids: z.array(z.string()), reasoning: z.string() })
const answerSchema = z.object({
  found: z.boolean(),
  answer: z.string(),
  sourcesIds: z.array(z.string()),
})

const NOT_FOUND: CentreAideOutput = { found: false, answer: '', sources: [] }

const known = (ids: ReadonlyArray<string>, pages: ReadonlyArray<HelpPage>): HelpPage[] =>
  ids.flatMap((id) => pages.filter((page) => page.id === id))

export const consultCentreAide: ToolDefinition<'consult_centre_aide'> = {
  description: `Renvoie la réponse du centre d'aide de kpilote à une question sur son fonctionnement, et les pages sur lesquelles elle s'appuie.
- \`found\` vrai : restitue fidèlement \`answer\`, sans la compléter de tes connaissances ni du glossaire, et sans poser de calcul sur des valeurs de la conversation. N'écris pas de lien : les pages sont affichées sous ta réponse.
- \`found\` faux : dis que le centre d'aide ne couvre pas la question, n'affirme aucune réponse, et indique que l'équipe KPILOTE peut répondre (son contact est affiché sous ta réponse).
Utilise-le pour : une définition (taux de progression, référentiel, collection…), une méthode de calcul, une procédure (import, saisie, droits), le fonctionnement de l'outil.
Ne l'utilise pas pour : les valeurs d'un indicateur, d'une collection ou d'un individu → les outils de données.`,
  execute: async ({ question }, { abortSignal, context }) => {
    const pages = await listHelpPages()
    if (pages.length === 0) return NOT_FOUND
    const signal = abortSignal ? { abortSignal } : {}

    const selection = await generateStructured({
      name: 'consult_centre_aide.selection',
      model: context.model,
      system: SELECTION_SYSTEM_PROMPT,
      prompt: `<question>${question}</question>\n<sommaire>${JSON.stringify(
        pages.map(({ id, titre, chemin, intertitres }) => ({ id, titre, chemin, intertitres })),
      )}</sommaire>`,
      schema: selectionSchema,
      trace: context.trace,
      ...signal,
    })
    const selected = known(selection.ids, pages).slice(0, MAX_HELP_PAGES)
    if (selected.length === 0) return NOT_FOUND

    const response = await generateStructured({
      name: 'consult_centre_aide.answer',
      model: context.model,
      system: ANSWER_SYSTEM_PROMPT,
      prompt: `<question>${question}</question>\n<pages>\n${selected
        .map(
          (page) =>
            `<page id="${page.id}" titre="${page.titre.replace(/["\n]/gu, ' ')}">\n${page.contenu}\n</page>`,
        )
        .join('\n')}\n</pages>`,
      schema: answerSchema,
      trace: context.trace,
      ...signal,
    })
    const sources = known(response.sourcesIds, selected)
    if (!response.found || sources.length === 0) return NOT_FOUND

    return {
      found: true,
      answer: response.answer,
      sources: sources.map(({ id, titre, chemin, url }) => ({ id, titre, chemin, url })),
    }
  },
}
