import { z } from 'zod'

import { dateSchema } from './dates'
import {
  axePublicIdSchema,
  individuPublicIdSchema,
  modalitePublicIdSchema,
  referentielPublicIdSchema,
} from './publicIds'

// Import de valeurs : le fichier lu (tableau source) et le plan de
// transformation produit par Albert.
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
  .enum(['EXACT', 'ALBERT', 'UTILISATEUR'])
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

// Ce sur quoi on peut saisir une valeur de l'indicateur : les individus de ses
// référentiels, et les modalités feuilles de chacun de ses axes.
export const ciblesSaisieApiModelSchema = z.object({
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
export type CiblesSaisieApiModel = z.infer<typeof ciblesSaisieApiModelSchema>
