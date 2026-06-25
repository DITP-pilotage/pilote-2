import { generateObject } from 'ai'
import { dateSchema } from '@pilote/mb-shared/dates'
import { errAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { ALBERT_TEMPERATURE, createAlbertModel } from '@/importPoc/helpers/albert'

const colonneDateSchema = z.object({
  nom: z
    .string()
    .describe("Nom exact du header de colonne contenant la date (recopie exacte)."),
  format: z
    .enum(['iso', 'fr-libre', 'quarter', 'annee'])
    .describe(
      "Type de format détecté pour la date. " +
        "'iso' = YYYY-MM-DD strict. " +
        "'fr-libre' = texte libre français (`1er janvier 2025`, `janvier 2026`, `01/01/2025`, etc.). " +
        "'quarter' = trimestre (`Q1 2023`, `T1 2023`, `1er trimestre 2023`). " +
        "'annee' = année seule (`2023`).",
    ),
})

const planLongSchema = z.object({
  layout: z
    .literal('long')
    .describe(
      "Format long : une ligne = une observation (triplet individu/date/valeur). " +
        "Exemple : colonnes `département, année, émissions`. " +
        "Choisis ce layout quand il y a une colonne date explicite.",
    ),
  colonneIndividu: z
    .string()
    .describe("Header de la colonne contenant le libellé de l'individu (territoire, entité…)."),
  colonneDate: colonneDateSchema,
  colonneValeur: z.string().describe('Header de la colonne contenant la valeur numérique.'),
})

const planPivotSchema = z.object({
  layout: z
    .literal('pivot')
    .describe(
      "Format pivot : une ligne = un individu, plusieurs colonnes-dates portent chacune une valeur. " +
        "Exemple : colonnes `département, 2021, 2022, 2023`. " +
        "Choisis ce layout quand les headers de colonnes sont eux-mêmes des dates.",
    ),
  colonneIndividu: z.string().describe("Header de la colonne contenant le libellé de l'individu."),
  colonnesPivot: z
    .array(
      z.object({
        nom: z.string().describe('Header exact de la colonne pivot (recopie exacte).'),
        dateIso: dateSchema.describe(
          "Date résolue par toi en ISO YYYY-MM-DD. " +
            "Pour une année seule, prends le 1er janvier. " +
            "Pour un mois seul, le 1er du mois. " +
            "Pour un trimestre, le 1er jour du premier mois du trimestre.",
        ),
      }),
    )
    .min(1)
    .describe(
      "Une entrée par colonne du fichier qui porte une valeur datée. " +
        "Ne pas inclure la colonne individu ni d'éventuelles colonnes de méta-données.",
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
        "À utiliser uniquement si la structure du fichier ne permet pas de produire un plan exploitable.",
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
          "Doit expliquer le problème et suggérer une correction (ex: « renomme la colonne X »).",
      ),
  }),
])

export type DecouverteOutput = z.infer<typeof decouverteOutputSchema>
export type Plan = Extract<DecouverteOutput, { statut: 'reconnu' }>['plan']
export type PlanLong = Extract<Plan, { layout: 'long' }>
export type PlanPivot = Extract<Plan, { layout: 'pivot' }>

const SYSTEM_PROMPT =
  "Tu reçois des données tabulaires hétérogènes téléversées par un agent territorial.\n" +
  "Ta tâche : produire un PLAN qui dit comment lire ce fichier pour en extraire des triplets " +
  "(individu, date, valeur) pour un indicateur donné.\n" +
  "\n" +
  "DEUX LAYOUTS POSSIBLES :\n" +
  "- 'long' : une ligne = une observation. Il y a une colonne date explicite.\n" +
  "- 'pivot' : une ligne = un individu, plusieurs colonnes-dates portent chacune une valeur. " +
  "Les headers de colonnes sont eux-mêmes des dates (années, mois, trimestres).\n" +
  "\n" +
  "Si la structure ne permet PAS de produire un plan exploitable, renvoie statut='echec' " +
  "avec une raison et une explication destinée à l'utilisateur.\n" +
  "Ne renvoie jamais un plan dont les noms de colonnes ne correspondent pas aux headers fournis."

const MAX_LIGNES_ECHANTILLON = 8

export type DecouvrirStructureError =
  | { type: 'ALBERT_NON_CONFIGURE' }
  | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }

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
  if (!model) return errAsync({ type: 'ALBERT_NON_CONFIGURE' })

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

  return ResultAsync.fromPromise(
    generateObject({
      model,
      schema: decouverteOutputSchema,
      system: SYSTEM_PROMPT,
      prompt,
      temperature: ALBERT_TEMPERATURE,
    }).then((result) => result.object),
    (cause): DecouvrirStructureError => ({ type: 'ALBERT_UNAVAILABLE', cause }),
  )
}
