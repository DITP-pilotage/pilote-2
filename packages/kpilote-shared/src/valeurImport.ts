import { z } from 'zod'

import { dateSchema } from './dates'
import {
  axePublicIdSchema,
  individuPublicIdSchema,
  modalitePublicIdSchema,
  referentielPublicIdSchema,
} from './publicIds'

// Import de valeurs : le fichier lu (tableau source), le plan de transformation
// produit par Albert, et le flux de la route qui construit ce plan.
// Voir `valeurImport/applyPlan.ts` pour l'application du plan au tableau.

export const MAX_LIGNES_TABLEAU = 1000
export const MAX_COLONNES_TABLEAU = 100

export const celluleSourceSchema = z
  .union([z.string(), z.number(), z.null()])
  .describe('Cellule du fichier. Une date de tableur arrive en chaîne ISO.')
export type CelluleSource = z.infer<typeof celluleSourceSchema>

export const tableauSourceSchema = z.object({
  entetes: z
    .array(z.string())
    .min(1)
    .max(MAX_COLONNES_TABLEAU)
    .describe('En-têtes du fichier, dans l’ordre des colonnes.'),
  lignes: z
    .array(z.array(celluleSourceSchema).max(MAX_COLONNES_TABLEAU))
    .min(1)
    .max(MAX_LIGNES_TABLEAU)
    .describe('Lignes de données : `lignes[i][j]` est la cellule de la colonne `entetes[j]`.'),
})
export type TableauSource = z.infer<typeof tableauSourceSchema>

export const origineRapprochementSchema = z
  .enum(['EXACT', 'LLM', 'UTILISATEUR'])
  .describe(
    'Qui a rapproché le libellé : une correspondance exacte, l’assistant IA, ou l’utilisateur.',
  )
export type OrigineRapprochement = z.infer<typeof origineRapprochementSchema>

export const rapprochementSchema = z.discriminatedUnion('statut', [
  z.object({
    statut: z.literal('RESOLU'),
    publicId: z.string().describe('Identifiant public de l’individu ou de la modalité.'),
    par: origineRapprochementSchema,
  }),
  z.object({
    statut: z.literal('AMBIGU'),
    candidats: z.array(z.string()).describe('Identifiants publics possibles pour ce libellé.'),
  }),
  z.object({ statut: z.literal('INCONNU') }),
])
export type Rapprochement = z.infer<typeof rapprochementSchema>

export const colonneRapprocheeSchema = z.object({
  colonne: z.string().describe('En-tête de la colonne du fichier.'),
  rapprochements: z
    .record(z.string(), rapprochementSchema)
    .describe('Un rapprochement par libellé distinct de la colonne.'),
})
export type ColonneRapprochee = z.infer<typeof colonneRapprocheeSchema>

export const dispositionValeursSchema = z.discriminatedUnion('disposition', [
  z.object({
    disposition: z.literal('LIGNES').describe('Une ligne du fichier porte une valeur.'),
    colonneDate: z.string(),
    colonneValeur: z.string(),
  }),
  z.object({
    disposition: z
      .literal('COLONNES')
      .describe('Une ligne du fichier porte une valeur par colonne de date.'),
    colonnes: z.array(z.object({ colonne: z.string(), date: dateSchema })).min(1),
  }),
])
export type DispositionValeurs = z.infer<typeof dispositionValeursSchema>

export const filtreLignesSchema = z
  .object({
    colonne: z.string(),
    valeursRetenues: z.array(z.string()),
  })
  .describe(
    'Lignes à garder : celles dont la cellule de `colonne` est dans `valeursRetenues` ' +
      '(exports qui mêlent valeurs initiales, cibles et d’avancement).',
  )
export type FiltreLignes = z.infer<typeof filtreLignesSchema>

export const planTransformationSchema = z.object({
  individu: colonneRapprocheeSchema,
  axes: z
    .array(colonneRapprocheeSchema.extend({ axe: axePublicIdSchema }))
    .describe('Une colonne par axe de l’indicateur, dans l’ordre des axes.'),
  valeurs: dispositionValeursSchema,
  filtre: filtreLignesSchema.optional(),
})
export type PlanTransformation = z.infer<typeof planTransformationSchema>

export const motifPlanImpossibleSchema = z.enum([
  'PAS_D_INDIVIDU',
  'PAS_DE_DATE',
  'PAS_DE_VALEUR',
  'AXE_SANS_COLONNE',
  'STRUCTURE_NON_RECONNUE',
  'ASSISTANT_INDISPONIBLE',
])
export type MotifPlanImpossible = z.infer<typeof motifPlanImpossibleSchema>

export const planImpossibleErrorSchema = z.object({
  type: z.literal('FICHIER_INEXPLOITABLE'),
  motif: motifPlanImpossibleSchema,
  axes: z.array(axePublicIdSchema).optional().describe('Axes sans colonne (`AXE_SANS_COLONNE`).'),
  explication: z.string().describe('Phrase destinée à l’utilisateur.'),
})
export type PlanImpossibleError = z.infer<typeof planImpossibleErrorSchema>

const statutEtapeSchema = z.enum(['EN_COURS', 'TERMINEE'])

export const etapePlanSchema = z.discriminatedUnion('etape', [
  z.object({
    etape: z.literal('STRUCTURE'),
    statut: statutEtapeSchema,
    valeurs: dispositionValeursSchema.optional(),
  }),
  z.object({
    etape: z.literal('INDIVIDUS'),
    statut: statutEtapeSchema,
    resolus: z.number().int().nonnegative().optional(),
    aVerifier: z.number().int().nonnegative().optional(),
  }),
  z.object({
    etape: z.literal('AXE'),
    axe: axePublicIdSchema,
    statut: statutEtapeSchema,
    resolus: z.number().int().nonnegative().optional(),
    aVerifier: z.number().int().nonnegative().optional(),
  }),
])
export type EtapePlan = z.infer<typeof etapePlanSchema>

// Un message du flux SSE de `valeurs:plan-import`.
export const planImportEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ETAPE'), etape: etapePlanSchema }),
  z.object({ type: z.literal('PLAN'), plan: planTransformationSchema }),
  z.object({ type: z.literal('ECHEC'), erreur: planImpossibleErrorSchema }),
])
export type PlanImportEvent = z.infer<typeof planImportEventSchema>

export const planImportBodySchema = z.object({
  tableau: tableauSourceSchema,
  nomFichier: z.string().max(255).describe('Nom du fichier, donné à Albert comme contexte.'),
})
export type PlanImportBody = z.infer<typeof planImportBodySchema>

// Ce sur quoi on peut saisir une valeur de l'indicateur : les individus de ses
// référentiels, et les modalités feuilles de chacun de ses axes. Aucune route ne
// le renvoie tel quel : la webapp le recompose depuis les routes de l'indicateur,
// des référentiels et des axes, l'API le charge pour Albert.
export const ciblesSaisieSchema = z.object({
  individus: z.array(
    z.object({
      id: individuPublicIdSchema,
      nom: z.string(),
      referentiel: referentielPublicIdSchema,
    }),
  ),
  axes: z
    .array(
      z.object({
        id: axePublicIdSchema,
        nom: z.string(),
        modalites: z.array(z.object({ id: modalitePublicIdSchema, nom: z.string() })),
      }),
    )
    .describe('Axes de l’indicateur, dans l’ordre de déclaration, avec leurs modalités feuilles.'),
})
export type CiblesSaisie = z.infer<typeof ciblesSaisieSchema>
