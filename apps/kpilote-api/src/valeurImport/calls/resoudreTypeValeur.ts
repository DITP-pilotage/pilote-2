import { generateObject } from 'ai'
import { ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'
import { ALBERT_TEMPERATURE, createAlbertModel } from '@/valeurImport/helpers/albert'

const outputSchema = z.object({
  typesValeurRetenus: z
    .array(z.string())
    .describe(
      'Sous-ensemble des valeurs fournies correspondant au concept de valeur ' +
        "d'avancement / valeur actuelle. Recopie EXACTE des valeurs reçues. " +
        'Liste vide si aucune ne correspond.',
    ),
})

export type ResoudreTypeValeurError = { type: 'ALBERT_UNAVAILABLE'; cause: unknown }

const SYSTEM_PROMPT =
  "Tu reçois l'ensemble des valeurs distinctes d'une colonne qui indique le TYPE DE VALEUR " +
  'dans un fichier de données territorial (souvent issu de Pilote PPG).\n' +
  'Trois concepts coexistent :\n' +
  '- valeur initiale (VI) — état de départ ;\n' +
  '- valeur cible (VC) — objectif visé ;\n' +
  "- valeur d'avancement / valeur actuelle (VA) — mesure constatée courante.\n" +
  '\n' +
  "kpilote n'importe QUE les valeurs d'avancement (VA). Ta tâche : parmi les valeurs " +
  "fournies, renvoie EXACTEMENT celles (recopiées à l'identique) qui correspondent au " +
  "concept de valeur d'avancement / valeur actuelle.\n" +
  '\n' +
  'La nomenclature varie : `va`, `VA`, `Valeur Actuelle`, `Valeur Avancement`, ' +
  '`VALEUR_AVANCEMENT`, etc. Ne conserve JAMAIS les valeurs correspondant à VI (valeur ' +
  'initiale) ou VC (valeur cible). Si aucune valeur ne correspond clairement à une valeur ' +
  "d'avancement, renvoie une liste vide."

export const resoudreTypeValeur = ({
  colonne,
  typesValeurDistincts,
}: {
  colonne: string
  typesValeurDistincts: ReadonlyArray<string>
}): ResultAsync<{ typesValeurRetenus: string[] }, ResoudreTypeValeurError> => {
  const model = createAlbertModel()

  const prompt = [
    `Colonne « ${colonne} ».`,
    `Valeurs distinctes rencontrées : ${JSON.stringify([...typesValeurDistincts])}`,
  ].join('\n')

  const elapsed = startTimer()
  logger.info(
    {
      event: 'importPoc.resoudreTypeValeur.start',
      colonne,
      nbValeursDistinctes: typesValeurDistincts.length,
    },
    'Albert call 1b (type de valeur) — début',
  )

  const distinctsSet = new Set(typesValeurDistincts)

  return ResultAsync.fromPromise(
    generateObject({
      model,
      schema: outputSchema,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: ALBERT_TEMPERATURE,
    }).then((result) => {
      // Filtre défensif : ne garder que les valeurs réellement présentes en entrée
      // (protection contre une éventuelle hallucination d'Albert).
      const typesValeurRetenus = result.object.typesValeurRetenus.filter((valeur) =>
        distinctsSet.has(valeur),
      )
      logger.info(
        {
          event: 'importPoc.resoudreTypeValeur.done',
          durationMs: elapsed(),
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          typesValeurRetenus,
        },
        'Albert call 1b (type de valeur) — fin',
      )
      return { typesValeurRetenus }
    }),
    (cause): ResoudreTypeValeurError => {
      logger.error(
        {
          event: 'importPoc.resoudreTypeValeur.error',
          durationMs: elapsed(),
          cause: cause instanceof Error ? cause.message : String(cause),
        },
        'Albert call 1b (type de valeur) — échec',
      )
      return { type: 'ALBERT_UNAVAILABLE', cause }
    },
  )
}
