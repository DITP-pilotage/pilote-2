import { z } from 'zod'

import { celluleIdSchema } from './cellule'
import { dateSchema } from './dates'
import { dimensionPublicIdSchema } from './dimension'
import { individuPublicIdSchema } from './publicIds'

const colonneDateSchema = z.object({
  nom: z.string(),
})

const colonneTypeValeurSchema = z.object({ nom: z.string() })

// Colonnes d'identité au-delà de `colonneIndividu` (indicateur multi-dimension,
// ex. territoire × opérateur) : chacune est résolue contre les membres d'une seule
// dimension. Absent pour un fichier à une seule colonne d'identité.
const colonnesIdentiteSupplementairesSchema = z.array(z.string()).min(1).optional()

const planLongSchema = z.object({
  layout: z.literal('long'),
  colonneIndividu: z.string(),
  colonnesIdentiteSupplementaires: colonnesIdentiteSupplementairesSchema,
  colonneDate: colonneDateSchema,
  colonneValeur: z.string(),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})

const planPivotSchema = z.object({
  layout: z.literal('pivot'),
  colonneIndividu: z.string(),
  colonnesIdentiteSupplementaires: colonnesIdentiteSupplementairesSchema,
  colonnesPivot: z.array(z.object({ nom: z.string(), dateIso: z.string() })).min(1),
  colonneTypeValeur: colonneTypeValeurSchema.optional(),
})

export const normaliserPlanSchema = z.discriminatedUnion('layout', [
  planLongSchema,
  planPivotSchema,
])
export type NormaliserPlan = z.infer<typeof normaliserPlanSchema>

// `individu` : publicId (mono) ou cellule canonique (membres dans l'ordre des
// dimensions, joints par `~`). `coordonnees` n'est présent qu'à partir de deux
// colonnes d'identité : c'est la forme à envoyer à `valeurs:batch`.
export const itemNormaliseApiModelSchema = z.object({
  individu: celluleIdSchema,
  coordonnees: z.array(individuPublicIdSchema).min(2).optional(),
  date: dateSchema,
  valeur: z.number(),
})
export type ItemNormaliseApiModel = z.infer<typeof itemNormaliseApiModelSchema>

export const normaliserWarningSchema = z.object({
  code: z.enum([
    'INDIVIDU_NON_RESOLU',
    'INDIVIDU_HALLUCINE',
    'DATE_INVALIDE',
    'VALEUR_INVALIDE',
    'CELLULE_VIDE',
    'LIGNE_IGNOREE',
    // Multi-dimension : une identité de la ligne n'est pas résolue (ligne écartée).
    'LIGNE_PARTIELLE',
    // Multi-dimension : une dimension dont la marginale agrège n'est couverte par
    // aucune colonne d'identité (les valeurs viseraient des cellules dérivées).
    'DIMENSIONS_NON_COUVERTES',
    // Multi-dimension : colonne d'identité rattachée à aucune dimension de l'indicateur.
    'COLONNE_IDENTITE_IGNOREE',
  ]),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  colonneSource: z.string().optional(),
})
export type NormaliserWarning = z.infer<typeof normaliserWarningSchema>

// Multi-dimension : la correspondance est indexée par (colonne, libellé) — un même
// libellé (« Orange » commune / opérateur) peut viser deux membres distincts.
const resolutionApiSchema = z.object({
  mapping: z.array(
    z.object({
      libelleSource: z.string(),
      individuPublicId: z.string(),
      colonne: z.string().optional(),
    }),
  ),
  nonResolus: z.array(
    z.object({ libelleSource: z.string(), raison: z.string(), colonne: z.string().optional() }),
  ),
  // Multi-dimension : dimension retenue pour chaque colonne d'identité, dans l'ordre
  // canonique des coordonnées (`colonnesIdentite[i]` est la colonne de `coordonnees[i]`).
  colonnesIdentite: z
    .array(
      z.object({
        colonne: z.string(),
        dimension: z.object({ id: dimensionPublicIdSchema, nom: z.string() }),
      }),
    )
    .optional(),
})

const rapportSchema = z.object({
  totalLignes: z.number().int().nonnegative(),
  totalItemsProduits: z.number().int().nonnegative(),
  totalLibellesSources: z.number().int().nonnegative(),
  totalLibellesMappes: z.number().int().nonnegative(),
  totalLibellesNonResolus: z.number().int().nonnegative(),
})

export const normaliserValeursImportResponseApiModelSchema = z.object({
  plan: normaliserPlanSchema,
  resolution: resolutionApiSchema,
  items: z.array(itemNormaliseApiModelSchema),
  warnings: z.array(normaliserWarningSchema),
  rapport: rapportSchema,
  resolutionTypeValeur: z
    .object({
      colonne: z.string(),
      typesValeurDistincts: z.array(z.string()),
      typesValeurRetenus: z.array(z.string()),
    })
    .optional(),
})
export type NormaliserValeursImportResponseApiModel = z.infer<
  typeof normaliserValeursImportResponseApiModelSchema
>

// Erreurs métier 422 de la normalisation. Source de vérité partagée back/front :
// la route type ses réponses contre ce schéma, le client parse le body avec.
export const normaliserErrorApiModelSchema = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('PLAN_ECHEC'),
    message: z.string(),
    details: z.object({ raison: z.string(), explication: z.string() }),
  }),
  z.object({
    code: z.literal('RESOLUTION_ECHEC'),
    message: z.string(),
  }),
])
export type NormaliserErrorApiModel = z.infer<typeof normaliserErrorApiModelSchema>
