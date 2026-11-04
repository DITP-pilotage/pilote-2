import { z } from 'zod'

import { type Dashboard } from './dashboard'
import { collectionIdInput, indicateurIdInput, individuIdInput, referentielIdInput } from './ids'

// Contrat des outils de l'assistant : la seule liste. Le serveur enregistre un outil par
// entrée, le front en dérive libellés, pastilles et nettoyage des pseudo-appels.
//
// Les discriminants sont des `z.enum` et jamais des `z.literal` : gpt-oss lit l'`enum` du
// JSON Schema mais ignore `const`, et inventait alors la valeur (constat PPG, PIL-1900).

export const MAX_PERIMETRE_INDIVIDUS = 20

export const PERIMETRE_DESCRIPTION = [
  "Les individus visés, en un seul appel : jamais un appel par individu. `type` vaut exactement l'une de ces valeurs :",
  '- SELECTION, avec individuIds : des individus précis, désignés par leurs identifiants.',
  "- ENFANTS_DE, avec individuId : les individus rattachés directement à celui-ci (par exemple les départements d'une région, les écoles d'une académie) ; l'individu lui-même n'en fait pas partie.",
  "- TOUT_LE_REFERENTIEL, avec referentielId : tous les individus d'un référentiel.",
].join('\n')

export const perimetreInput = z
  .discriminatedUnion('type', [
    z.object({
      type: z.enum(['SELECTION']),
      individuIds: z.array(individuIdInput).min(1).max(MAX_PERIMETRE_INDIVIDUS),
    }),
    z.object({ type: z.enum(['ENFANTS_DE']), individuId: individuIdInput }),
    z.object({ type: z.enum(['TOUT_LE_REFERENTIEL']), referentielId: referentielIdInput }),
  ])
  .describe(PERIMETRE_DESCRIPTION)

export type Perimetre = z.output<typeof perimetreInput>

export const searchInput = z.object({
  query: z
    .string()
    .min(1)
    .max(500)
    .describe("La formulation de l'utilisateur, telle quelle, sans reformulation."),
})

export const searchIndividusInput = searchInput.extend({
  referentielId: referentielIdInput
    .optional()
    .describe('Restreint la recherche à un référentiel, quand la demande le précise.'),
})

export const syntheseIndicateurInput = z.object({
  indicateurId: indicateurIdInput,
  individuId: individuIdInput
    .optional()
    .describe('Un seul individu. Pour plusieurs, utilise perimetre.'),
  perimetre: perimetreInput.optional(),
})

export const syntheseCollectionInput = z.object({
  collectionId: collectionIdInput,
  individuId: individuIdInput,
})

export const evolutionIndicateurInput = z.object({
  indicateurId: indicateurIdInput,
  individuId: individuIdInput,
})

export const commentairesInput = z.discriminatedUnion('cible', [
  z.object({
    cible: z.enum(['INDICATEUR']),
    indicateurId: indicateurIdInput,
    individuId: individuIdInput,
  }),
  z.object({ cible: z.enum(['COLLECTION']), collectionId: collectionIdInput }),
])

export const consultCentreAideInput = z.object({
  question: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'La question, autonome : avec le contexte utile à la recherche (« comment est calculé le taux de progression d’un indicateur »), sans valeur chiffrée de la conversation.',
    ),
})

export const rapportSujetInput = z
  .discriminatedUnion('type', [
    z.object({ type: z.enum(['COLLECTION']), collectionId: collectionIdInput }),
    z.object({ type: z.enum(['INDICATEUR']), indicateurId: indicateurIdInput }),
  ])
  .describe(
    "Ce que l'encart décrit : une collection (type COLLECTION, avec collectionId) ou un indicateur (type INDICATEUR, avec indicateurId).",
  )

export type RapportSujet = z.output<typeof rapportSujetInput>

export const writeSyntheseInput = z.object({
  sujet: rapportSujetInput,
  individuId: individuIdInput,
})

export const writeComparaisonInput = z.object({
  sujet: rapportSujetInput,
  perimetre: perimetreInput.describe(
    `Au moins deux individus à comparer.\n${PERIMETRE_DESCRIPTION}`,
  ),
})

const ids = (input: z.ZodType<string, string>, max: number, description: string) =>
  z.array(input).max(max).optional().describe(description)

export const createDashboardInput = z.object({
  task: z
    .string()
    .min(1)
    .max(1000)
    .describe(
      'Ce que le dashboard doit montrer, dans les mots de la demande (« la courbe de IND-42 dans le Nord et le Pas-de-Calais »).',
    ),
  indicateurIds: ids(indicateurIdInput, 10, 'Les indicateurs à montrer.'),
  collectionIds: ids(collectionIdInput, 5, 'Les collections à montrer.'),
  individuIds: ids(individuIdInput, 20, 'Les individus concernés.'),
  referentielIds: ids(
    referentielIdInput,
    5,
    'Les référentiels à cartographier ou à résumer, quand la demande les vise.',
  ),
})

export const clarifyInput = z.object({
  question: z.string().min(1).describe('Question affichée en haut du panneau de choix.'),
  choices: z
    .array(
      z.object({
        label: z
          .string()
          .min(1)
          .describe('Texte du bouton, formulé comme la demande de l’utilisateur.'),
        value: z.string().min(1).describe('Valeur stable du choix.'),
      }),
    )
    .min(2)
    .max(4)
    .describe('Options concrètes et réalisables entre lesquelles trancher (2 à 4).'),
})

export type ToolKind = 'source' | 'interface' | 'help' | 'report' | 'dashboard'

type ToolContract = { label: string; kind: ToolKind; input: z.ZodType }

export const TOOLS = {
  search_indicateurs: { label: "Recherche d'indicateurs", kind: 'source', input: searchInput },
  search_collections: { label: 'Recherche de collections', kind: 'source', input: searchInput },
  search_individus: { label: "Recherche d'individus", kind: 'source', input: searchIndividusInput },
  get_synthese_indicateur: {
    label: "Synthèse de l'indicateur",
    kind: 'source',
    input: syntheseIndicateurInput,
  },
  get_synthese_collection: {
    label: 'Synthèse de la collection',
    kind: 'source',
    input: syntheseCollectionInput,
  },
  get_evolution_indicateur: {
    label: "Évolution de l'indicateur",
    kind: 'source',
    input: evolutionIndicateurInput,
  },
  get_commentaires: { label: 'Commentaires', kind: 'source', input: commentairesInput },
  consult_centre_aide: {
    label: "Centre d'aide",
    kind: 'help',
    input: consultCentreAideInput,
  },
  write_synthese: { label: 'Synthèse', kind: 'report', input: writeSyntheseInput },
  write_comparaison: { label: 'Comparaison', kind: 'report', input: writeComparaisonInput },
  create_dashboard: {
    label: 'Tableau de bord',
    kind: 'dashboard',
    input: createDashboardInput,
  },
  clarify_with_choices: { label: 'Question de précision', kind: 'interface', input: clarifyInput },
} as const satisfies Record<string, ToolContract>

export type ToolName = keyof typeof TOOLS

export const TOOL_NAMES = Object.keys(TOOLS) as ReadonlyArray<ToolName>

export type ToolInput<N extends ToolName> = z.output<(typeof TOOLS)[N]['input']>

// --- Sorties -----------------------------------------------------------------------------
// Clés techniques en anglais, valeurs lues par le modèle en français : des libellés, jamais
// des codes, et toujours le nom à côté de l'identifiant.

export type ToolError = { error: string }

export type EntityRef = { id: string; nom: string }

export type NamedEntity = EntityRef & { referentiel?: EntityRef }

export type SearchOutput = {
  results: NamedEntity[]
  /** Renseigné quand la recherche ne peut pas conclure : le modèle doit le rapporter. */
  needsClarification?: string
}

export type DatedValue = { valeur: number; date: string }

export type SyntheseIndicateurOutput = {
  indicateur:
    | (EntityRef & {
        unite: string | null
        description: string | null
        referentiels: EntityRef[]
      })
    | null
  individus: Array<{
    individu: EntityRef
    derniereValeur: DatedValue | null
    objectif: DatedValue | null
    tauxProgression: number | null
    variation: number | null
    ecartMediane: number | null
  }>
  valeursRemarquables: Array<{
    referentiel: EntityRef
    min: number | null
    max: number | null
    mediane: number | null
  }>
  notFound: string[]
  total?: number
  truncated?: boolean
  needsClarification?: string
}

export type SyntheseCollectionOutput = {
  collection: (EntityRef & { description: string | null }) | null
  individu: EntityRef | null
  tauxProgression: number | null
  contributions: Array<{
    indicateur: EntityRef
    ponderation: number
    tauxProgression: number | null
  }>
  notFound: string[]
}

export type EvolutionIndicateurOutput = {
  indicateur: (EntityRef & { unite: string | null }) | null
  individu: EntityRef | null
  points: DatedValue[]
  total: number
  truncated: boolean
  notFound: string[]
}

export type CommentairesOutput = {
  groupes: Array<{
    type: string
    versions: Array<{ date: string; texte: string }>
    truncated: boolean
  }>
  notFound: string[]
}

export type HelpSource = { id: string; titre: string; chemin: string[]; url: string }

export type CentreAideOutput = {
  found: boolean
  /** La réponse du centre d'aide, à restituer fidèlement ; vide quand `found` est faux. */
  answer: string
  sources: HelpSource[]
}

export type RapportType = 'synthese' | 'comparaison'

/**
 * Un état de l'encart : l'outil en émet plusieurs pendant la rédaction, chacun avec tout le
 * texte rédigé jusque-là ; le dernier a `done`.
 */
export type RapportOutput = {
  type: RapportType
  dateRedaction: string
  markdown: string
  done: boolean
  /** Sujet ou individus inexistants ou illisibles : aucun encart n'est rédigé. */
  notFound?: string[]
  /** La demande ne permet pas d'encart (une comparaison d'un seul individu) : à rapporter. */
  needsClarification?: string
}

export type ClarifyOutput = z.output<typeof clarifyInput>

export interface ToolOutputs {
  search_indicateurs: SearchOutput
  search_collections: SearchOutput
  search_individus: SearchOutput
  get_synthese_indicateur: SyntheseIndicateurOutput
  get_synthese_collection: SyntheseCollectionOutput
  get_evolution_indicateur: EvolutionIndicateurOutput
  get_commentaires: CommentairesOutput
  consult_centre_aide: CentreAideOutput
  write_synthese: RapportOutput
  write_comparaison: RapportOutput
  create_dashboard: Dashboard
  clarify_with_choices: ClarifyOutput
}

export type KpiloteUITools = {
  [N in ToolName]: {
    input: z.input<(typeof TOOLS)[N]['input']>
    output: ToolOutputs[N] | ToolError
  }
}

// Garde de compilation : un outil sans type de sortie, ou une sortie sans outil, rend
// l'affectation impossible.
type ToolCoverage = keyof ToolOutputs extends ToolName
  ? ToolName extends keyof ToolOutputs
    ? true
    : never
  : never

export const TOOL_COVERAGE: ToolCoverage = true
