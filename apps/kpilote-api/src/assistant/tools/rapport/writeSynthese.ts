import { streamSubagentText } from '@/framework/llm/albert'
import { collectSynthese } from '@/assistant/tools/rapport/collect'
import { buildSyntheseSystemPrompt } from '@/assistant/tools/rapport/prompts'
import { rapportToModel, writeRapport } from '@/assistant/tools/rapport/writeRapport'
import { type StreamToolDefinition } from '@/assistant/tools/toolDefinition'

export const writeSynthese: StreamToolDefinition<'write_synthese'> = {
  description: `Rédige un encart de synthèse sur une collection ou un indicateur pour un individu : une note structurée que l'utilisateur copie ou télécharge en PDF depuis son bouton « Exporter ». Il collecte lui-même ses données : n'appelle pas en plus les outils de données.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
Utilise-le pour : une synthèse, un rapport, un récap, l'état général d'une collection ou d'un indicateur pour un individu, une demande de rapport à télécharger ou à exporter.
Ne l'utilise pas pour : une question précise (une valeur, un taux, une évolution, des commentaires) → les outils de données ; plusieurs individus → write_comparaison.`,
  async *stream(input, { abortSignal, context }) {
    const collected = await collectSynthese(input, {
      ...(abortSignal ? { abortSignal } : {}),
      context,
    })
    yield* writeRapport({
      type: 'synthese',
      collected,
      redact: (prompt) =>
        streamSubagentText({
          name: 'write_synthese',
          model: context.model,
          system: buildSyntheseSystemPrompt(input.sujet.type),
          prompt,
          trace: context.trace,
          ...(abortSignal ? { abortSignal } : {}),
        }),
    })
  },
  toModelOutput: rapportToModel,
}
