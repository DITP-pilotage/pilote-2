import { PERIMETRE_DESCRIPTION } from '@pilote/kpilote-shared/assistant/tools'

import { streamSubagentText } from '@/framework/llm/albert'
import { collectComparaison } from '@/assistant/tools/rapport/collect'
import { buildComparaisonSystemPrompt } from '@/assistant/tools/rapport/prompts'
import { rapportToModel, writeRapport } from '@/assistant/tools/rapport/writeRapport'
import { type StreamToolDefinition } from '@/assistant/tools/toolDefinition'

export const writeComparaison: StreamToolDefinition<'write_comparaison'> = {
  description: `Rédige un encart de comparaison d'une collection ou d'un indicateur entre au moins deux individus : une note structurée que l'utilisateur copie ou télécharge en PDF depuis son bouton « Exporter ». Il collecte lui-même ses données : n'appelle pas en plus les outils de données.
- \`notFound\` : identifiants inexistants ou que l'utilisateur ne peut pas consulter ; ne les distingue pas.
- \`needsClarification\` : le périmètre ne désigne pas assez d'individus ; dis-le.
Utilise-le pour : « compare X et Y », « compare une région avec ses départements », un rapport comparatif à télécharger ou à exporter.
Ne l'utilise pas pour : comparer une seule métrique ou établir un classement (« qui a le meilleur taux ? ») → get_synthese_indicateur avec un périmètre ; un seul individu → write_synthese.

${PERIMETRE_DESCRIPTION}`,
  async *stream(input, { abortSignal, context }) {
    const collected = await collectComparaison(input, {
      ...(abortSignal ? { abortSignal } : {}),
      context,
    })
    yield* writeRapport({
      type: 'comparaison',
      collected,
      redact: (prompt) =>
        streamSubagentText({
          name: 'write_comparaison',
          model: context.model,
          system: buildComparaisonSystemPrompt(input.sujet.type),
          prompt,
          trace: context.trace,
          ...(abortSignal ? { abortSignal } : {}),
        }),
    })
  },
  toModelOutput: rapportToModel,
}
