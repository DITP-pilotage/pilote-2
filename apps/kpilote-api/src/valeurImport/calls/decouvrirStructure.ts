import { generateObject } from 'ai'
import { dateSchema } from '@pilote/kpilote-shared/dates'
import { ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'
import { ALBERT_TEMPERATURE, createAlbertModel } from '@/valeurImport/helpers/albert'

const colonneDateSchema = z.object({
  nom: z.string().describe('Nom exact du header de colonne contenant la date (recopie exacte).'),
})

const colonneTypeValeurSchema = z.object({
  nom: z
    .string()
    .describe('Header exact de la colonne indiquant le type de valeur (recopie exacte).'),
})

const planLongSchema = z.object({
  layout: z
    .literal('long')
    .describe(
      'Format long : une ligne = une observation (triplet individu/date/valeur). ' +
        'Exemple : colonnes `département, année, émissions`. ' +
        'Choisis ce layout quand il y a une colonne date explicite.',
    ),
  colonneIndividu: z
    .string()
    .describe("Header de la colonne contenant le libellé de l'individu (territoire, entité…)."),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string().describe('Header de la colonne contenant la valeur numérique.'),
  colonneTypeValeur: colonneTypeValeurSchema
    .optional()
    .describe(
      'Colonne OPTIONNELLE distinguant plusieurs types de valeur : valeur initiale, ' +
        "valeur cible, valeur d'avancement / valeur actuelle (typique des exports Pilote PPG). " +
        'Ne renseigne ce champ QUE si une telle colonne existe réellement dans les headers.',
    ),
})

const planPivotSchema = z.object({
  layout: z
    .literal('pivot')
    .describe(
      'Format pivot : une ligne = un individu, plusieurs colonnes-dates portent chacune une valeur. ' +
        'Exemple : colonnes `département, 2021, 2022, 2023`. ' +
        'Choisis ce layout quand les headers de colonnes sont eux-mêmes des dates.',
    ),
  colonneIndividu: z.string().describe("Header de la colonne contenant le libellé de l'individu."),
  colonnesPivot: z
    .array(
      z.object({
        nom: z.string().describe('Header exact de la colonne pivot (recopie exacte).'),
        dateIso: dateSchema.describe(
          'Date résolue par toi en ISO YYYY-MM-DD. ' +
            'Pour une année seule, prends le 1er janvier. ' +
            'Pour un mois seul, le 1er du mois. ' +
            'Pour un trimestre, le 1er jour du premier mois du trimestre.',
        ),
      }),
    )
    .min(1)
    .describe(
      'Une entrée par colonne du fichier qui porte une valeur datée. ' +
        "Ne pas inclure la colonne individu ni d'éventuelles colonnes de méta-données.",
    ),
  colonneTypeValeur: colonneTypeValeurSchema
    .optional()
    .describe(
      'Colonne OPTIONNELLE distinguant plusieurs types de valeur : valeur initiale, ' +
        "valeur cible, valeur d'avancement / valeur actuelle (typique des exports Pilote PPG). " +
        'Ne renseigne ce champ QUE si une telle colonne existe réellement dans les headers.',
    ),
})

export const decouverteOutputSchema = z.discriminatedUnion('statut', [
  z.object({
    statut: z.literal('reconnu'),
    plan: z.discriminatedUnion('layout', [planLongSchema, planPivotSchema]),
  }),
  z.object({
    statut: z
      .literal('echec')
      .describe(
        'À utiliser uniquement si la structure du fichier ne permet pas de produire un plan exploitable.',
      ),
    raison: z
      .enum([
        'PAS_DE_COLONNE_VALEUR',
        'PAS_DE_COLONNE_INDIVIDU',
        'PAS_DE_COLONNE_DATE',
        'STRUCTURE_NON_RECONNUE',
      ])
      .describe('Code court identifiant la cause principale.'),
    explication: z
      .string()
      .describe(
        "Phrase courte en français destinée à l'utilisateur final. " +
          'Doit expliquer le problème et suggérer une correction (ex: « renomme la colonne X »).',
      ),
  }),
])

export type DecouverteOutput = z.infer<typeof decouverteOutputSchema>
export type Plan = Extract<DecouverteOutput, { statut: 'reconnu' }>['plan']
export type PlanLong = Extract<Plan, { layout: 'long' }>
export type PlanPivot = Extract<Plan, { layout: 'pivot' }>

const SYSTEM_PROMPT =
  'Tu reçois des données tabulaires hétérogènes téléversées par un agent territorial.\n' +
  'Ta tâche : produire un PLAN qui dit comment lire ce fichier pour en extraire des triplets ' +
  '(individu, date, valeur) pour un indicateur donné.\n' +
  '\n' +
  'DEUX LAYOUTS POSSIBLES :\n' +
  "- 'long' : une ligne = une observation. Il y a une colonne date explicite.\n" +
  "- 'pivot' : une ligne = un individu, plusieurs colonnes-dates portent chacune une valeur. " +
  'Les headers de colonnes sont eux-mêmes des dates (années, mois, trimestres).\n' +
  '\n' +
  "Si la structure ne permet PAS de produire un plan exploitable, renvoie statut='echec' " +
  "avec une raison et une explication destinée à l'utilisateur.\n" +
  '\n' +
  'DÉTECTION OPTIONNELLE — TYPE DE VALEUR :\n' +
  'Certains fichiers (exports Pilote PPG) contiennent une colonne distinguant plusieurs ' +
  "types de valeur : valeur initiale, valeur cible, valeur d'avancement (aussi « valeur " +
  'actuelle »). Si une telle colonne existe, renseigne `colonneTypeValeur.nom` avec son ' +
  'header exact. Sinon, laisse ce champ absent.\n' +
  '\n' +
  'Ne renvoie jamais un plan dont les noms de colonnes ne correspondent pas aux headers fournis.'

const MAX_LIGNES_ECHANTILLON = 8

export type DecouvrirStructureError = { type: 'ALBERT_UNAVAILABLE'; cause: unknown }

export const decouvrirStructure = ({
  indicateur,
  headers,
  rows,
  nomFichier,
}: {
  indicateur: { nom: string; uniteLibelle: string | null }
  headers: ReadonlyArray<string>
  rows: ReadonlyArray<Record<string, unknown>>
  nomFichier?: string
}): ResultAsync<DecouverteOutput, DecouvrirStructureError> => {
  const model = createAlbertModel()
  const echantillon = rows.slice(0, MAX_LIGNES_ECHANTILLON)

  const prompt = [
    `Indicateur ciblé : « ${indicateur.nom} »${
      indicateur.uniteLibelle ? ` (unité : ${indicateur.uniteLibelle})` : ''
    }.`,
    nomFichier ? `Fichier source : « ${nomFichier} ».` : '',
    '',
    `Headers du fichier (${headers.length}) : ${JSON.stringify(headers)}`,
    '',
    `Échantillon des ${echantillon.length} premières lignes :`,
    JSON.stringify(echantillon, null, 2),
  ]
    .filter(Boolean)
    .join('\n')

  const elapsed = startTimer()
  logger.info(
    {
      event: 'importPoc.decouvrirStructure.start',
      indicateurNom: indicateur.nom,
      nbHeaders: headers.length,
      nbRows: rows.length,
      tailleEchantillon: echantillon.length,
      ...(nomFichier ? { nomFichier } : {}),
    },
    'Albert call 1 (découverte) — début',
  )

  return ResultAsync.fromPromise(
    generateObject({
      model,
      schema: decouverteOutputSchema,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: ALBERT_TEMPERATURE,
    }).then((result) => {
      const durationMs = elapsed()
      const usage = result.usage
      const output = result.object
      logger.info(
        {
          event: 'importPoc.decouvrirStructure.done',
          durationMs,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          statut: output.statut,
          ...(output.statut === 'reconnu'
            ? {
                layout: output.plan.layout,
                colonneIndividu: output.plan.colonneIndividu,
                ...(output.plan.layout === 'long'
                  ? {
                      colonneDate: output.plan.colonneDate.nom,
                      colonneValeur: output.plan.colonneValeur,
                    }
                  : { nbColonnesPivot: output.plan.colonnesPivot.length }),
              }
            : { raison: output.raison, explication: output.explication }),
        },
        'Albert call 1 (découverte) — fin',
      )
      return output
    }),
    (cause): DecouvrirStructureError => {
      logger.error(
        {
          event: 'importPoc.decouvrirStructure.error',
          durationMs: elapsed(),
          cause: cause instanceof Error ? cause.message : String(cause),
        },
        'Albert call 1 (découverte) — échec',
      )
      return { type: 'ALBERT_UNAVAILABLE', cause }
    },
  )
}
