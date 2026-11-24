import {
  type CiblesSaisie,
  type PlanImpossibleError,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { generateText, stepCountIs, tool } from 'ai'
import { err, ok, type Result } from 'neverthrow'
import { z } from 'zod'

import { createAlbertModel, STRUCTURED_TEMPERATURE } from '@/framework/llm/albert'
import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'
import { buildProfilColonnes } from '@/valeurImport/profilColonnes'
import { ALBERT_IMPORT_OPTIONS } from '@/valeurImport/albert/providerOptions'
import { checkStructure, type StructureValidee } from '@/valeurImport/rules'

// Étape 1 du plan : Albert dit le rôle de chaque colonne du fichier. Il remet sa
// réponse par un tool, dont le retour lui signale ses erreurs pour qu'il corrige.

const MAX_STEPS = 4
const MAX_LIGNES_EXEMPLE = 8
const MAX_MODALITES_EXEMPLE = 8

const structureProposeeSchema = z.object({
  colonneIndividu: z
    .string()
    .describe("En-tête exact de la colonne qui désigne l'individu (département, entité…)."),
  colonnesAxes: z
    .array(
      z.object({
        axe: z.string().describe("Identifiant de l'axe, recopié de la liste des axes."),
        colonne: z
          .string()
          .describe("En-tête exact de la colonne qui porte les modalités de l'axe."),
      }),
    )
    .describe("Une entrée par axe de l'indicateur présent dans le fichier. Vide sans axe."),
  disposition: z
    .enum(['LIGNES', 'COLONNES'])
    .describe(
      'LIGNES : une ligne du fichier porte une seule valeur, avec une colonne de date. ' +
        'COLONNES : les en-têtes de plusieurs colonnes sont des dates, chaque ligne porte une valeur par date.',
    ),
  colonneDate: z
    .string()
    .nullish()
    .describe('Disposition LIGNES seulement : en-tête exact de la colonne de date.'),
  colonneValeur: z
    .string()
    .nullish()
    .describe('Disposition LIGNES seulement : en-tête exact de la colonne de la valeur numérique.'),
  colonnesDates: z
    .array(
      z.object({
        colonne: z.string().describe('En-tête exact de la colonne.'),
        date: z
          .string()
          .nullish()
          .describe(
            'Date de la colonne au format AAAA-MM-JJ, à donner seulement si l’en-tête ne se lit ' +
              'pas tout seul comme une date (une année, un mois, un trimestre se lisent tout seuls).',
          ),
      }),
    )
    .nullish()
    .describe(
      'Disposition COLONNES seulement : une entrée par colonne dont l’en-tête est une date.',
    ),
  colonneFiltre: z
    .string()
    .nullish()
    .describe(
      'En-tête exact de la colonne qui distingue valeur initiale, valeur cible et valeur ' +
        "d'avancement. Absent si le fichier n'a pas une telle colonne.",
    ),
  valeursFiltre: z
    .array(z.string())
    .nullish()
    .describe(
      "Valeurs de la colonne de filtre qui désignent la valeur d'avancement (valeur actuelle), " +
        'recopiées exactement. Jamais la valeur initiale ni la valeur cible.',
    ),
})

const fichierInexploitableSchema = z.object({
  motif: z
    .enum(['PAS_D_INDIVIDU', 'PAS_DE_DATE', 'PAS_DE_VALEUR', 'STRUCTURE_NON_RECONNUE'])
    .describe('Ce qui manque au fichier.'),
  explication: z
    .string()
    .describe(
      "Une phrase en français pour l'utilisateur : ce qui manque et comment corriger le fichier.",
    ),
})

const SYSTEM_PROMPT = [
  "Tu lis un fichier de données tabulaires déposé par un agent public. Ta seule tâche : dire le rôle de chaque colonne, pour en extraire des valeurs d'un indicateur.",
  '',
  'Une valeur se définit par : un individu, une date, un nombre, et une modalité pour chaque axe de l’indicateur.',
  '',
  'Deux dispositions existent.',
  '- LIGNES : une ligne porte une valeur. Exemple d’en-têtes : `Département, Période, Taux`. Tu donnes `colonneDate` et `colonneValeur`.',
  '- COLONNES : les en-têtes sont des dates. Exemple : `Département, 2021, 2022, 2023`. Tu donnes `colonnesDates`, une entrée par colonne de date.',
  '',
  'Règles.',
  '- Recopie les en-têtes exactement, caractère pour caractère. N’invente aucune colonne.',
  '- Une colonne n’a qu’un seul rôle.',
  '- Pour chaque axe de l’indicateur, cherche la colonne dont les cellules ressemblent à ses modalités. Si aucune colonne ne convient, ne cite pas cet axe.',
  '- `colonneFiltre` ne sert que si une colonne distingue valeur initiale, valeur cible et valeur d’avancement (par exemple `VI`, `VC`, `VA`). Dans ce cas `valeursFiltre` ne contient que les valeurs d’avancement.',
  '',
  'Quand tu as fini, appelle le tool `decrire_structure`. S’il te renvoie des erreurs, corrige-les et rappelle-le.',
  'Si le fichier ne contient pas d’individu, pas de date ou pas de valeur numérique, appelle `declarer_fichier_inexploitable`.',
].join('\n')

const buildPrompt = ({
  indicateur,
  nomFichier,
  tableau,
  axes,
}: {
  indicateur: { nom: string; unite: string | null }
  nomFichier: string
  tableau: TableauSource
  axes: CiblesSaisie['axes']
}): string => {
  const exemples = tableau.lignes
    .slice(0, MAX_LIGNES_EXEMPLE)
    .map((ligne) =>
      Object.fromEntries(tableau.entetes.map((entete, index) => [entete, ligne[index] ?? null])),
    )
  const axesDecrits = axes.map((axe) => ({
    axe: axe.id,
    nom: axe.nom,
    exemplesDeModalites: axe.modalites
      .slice(0, MAX_MODALITES_EXEMPLE)
      .map((modalite) => modalite.nom),
  }))
  return [
    `Indicateur : « ${indicateur.nom} »${indicateur.unite ? ` (unité : ${indicateur.unite})` : ''}.`,
    `Fichier : « ${nomFichier} », ${tableau.lignes.length} lignes.`,
    '',
    axes.length > 0
      ? `Axes de l'indicateur :\n${JSON.stringify(axesDecrits, null, 2)}`
      : "L'indicateur n'a pas d'axe : `colonnesAxes` est vide.",
    '',
    `Colonnes du fichier :\n${JSON.stringify(buildProfilColonnes({ tableau }), null, 2)}`,
    '',
    `Premières lignes :\n${JSON.stringify(exemples, null, 2)}`,
  ].join('\n')
}

const STRUCTURE_NON_RECONNUE: PlanImpossibleError = {
  type: 'FICHIER_INEXPLOITABLE',
  motif: 'STRUCTURE_NON_RECONNUE',
  explication:
    "L'assistant IA n'a pas su lire la structure de ce fichier. Utilisez le format standard, ou simplifiez le fichier : une ligne d'en-têtes, puis les données.",
}

export const describeStructure = async ({
  indicateur,
  nomFichier,
  tableau,
  axes,
  abortSignal,
}: {
  indicateur: { nom: string; unite: string | null }
  nomFichier: string
  tableau: TableauSource
  axes: CiblesSaisie['axes']
  abortSignal?: AbortSignal | undefined
}): Promise<Result<StructureValidee, PlanImpossibleError>> => {
  let acceptee: StructureValidee | null = null
  let echec: PlanImpossibleError | null = null
  let essais = 0
  const elapsed = startTimer()

  const result = await generateText({
    model: createAlbertModel(),
    system: SYSTEM_PROMPT,
    prompt: buildPrompt({ indicateur, nomFichier, tableau, axes }),
    temperature: STRUCTURED_TEMPERATURE,
    providerOptions: ALBERT_IMPORT_OPTIONS,
    tools: {
      decrire_structure: tool({
        description:
          'Remet la structure du fichier. Renvoie `ok: true` si elle est acceptée, sinon la liste des erreurs à corriger.',
        inputSchema: structureProposeeSchema,
        // oxlint-disable-next-line typescript/require-await -- le SDK attend une fonction asynchrone
        execute: async (proposition) => {
          essais += 1
          const checked = checkStructure({
            proposition,
            tableau,
            axes: axes.map((axe) => axe.id),
          })
          if (checked.isErr()) {
            return {
              ok: false as const,
              erreurs: checked.error.erreurs,
              consigne: 'Corrige ces erreurs et rappelle `decrire_structure`.',
            }
          }
          acceptee = checked.value
          return { ok: true as const }
        },
      }),
      declarer_fichier_inexploitable: tool({
        description: "Déclare que le fichier ne permet pas d'extraire des valeurs.",
        inputSchema: fichierInexploitableSchema,
        // oxlint-disable-next-line typescript/require-await -- le SDK attend une fonction asynchrone
        execute: async ({ motif, explication }) => {
          echec = { type: 'FICHIER_INEXPLOITABLE', motif, explication }
          return { ok: true as const }
        },
      }),
    },
    // On s'arrête dès qu'Albert a remis une réponse recevable.
    stopWhen: [stepCountIs(MAX_STEPS), () => acceptee !== null || echec !== null],
    ...(abortSignal ? { abortSignal } : {}),
  })

  logger.info(
    {
      event: 'valeurImport.describeStructure',
      durationMs: elapsed(),
      essais,
      etapes: result.steps.length,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      acceptee: acceptee !== null,
      // Un appel de tool refusé par son schéma coûte un aller-retour : on veut le voir.
      appelsInvalides: result.steps.flatMap((step) =>
        step.content.flatMap((part) =>
          part.type === 'tool-call' && part.invalid === true ? [JSON.stringify(part.input)] : [],
        ),
      ),
    },
    'Import : structure du fichier',
  )

  if (acceptee === null && echec === null) {
    logger.warn(
      {
        event: 'valeurImport.describeStructure.sansReponse',
        etapes: result.steps.map((step) => ({
          finishReason: step.finishReason,
          text: step.text,
          content: step.content,
        })),
      },
      'Import : Albert n’a remis aucune structure recevable',
    )
  }

  // TypeScript ne suit pas les affectations faites dans les `execute`.
  const structure = acceptee as StructureValidee | null
  const declared = echec as PlanImpossibleError | null
  if (structure) return ok(structure)
  if (declared) return err(declared)
  return err(STRUCTURE_NON_RECONNUE)
}
