import { z } from 'zod'

import { dateSchema, dateTruncSchema, isCoarserOrEqual } from './dates'
import { indicateurPublicIdSchema } from './publicIds'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'

export const listTauxProgressionQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema
      .optional()
      .describe(
        'Date ISO YYYY-MM-DD inclusive (filtre les points dont le bucket est >= dateDebut).',
      ),
    dateFin: dateSchema
      .optional()
      .describe('Date ISO YYYY-MM-DD inclusive (filtre les points dont le bucket est <= dateFin).'),
    dateTruncValeur: dateTruncSchema
      .optional()
      .describe(
        'Granularité de bucket appliquée aux valeurs (défaut `month`). Détermine la fréquence ' +
          'des points retournés : un point par bucket de valeur résolu.',
      ),
    dateTruncObjectif: dateTruncSchema
      .optional()
      .describe(
        'Granularité de bucket appliquée aux objectifs (défaut `month`). Doit être >= ' +
          '`dateTruncValeur` : un objectif qui change plus souvent que les mesures ne peut pas ' +
          "être évalué. Cas d'usage typique : `dateTruncValeur=month` + `dateTruncObjectif=year` " +
          "pour suivre l'évolution mensuelle des valeurs contre un objectif annuel.",
      ),
  })
  .refine((value) => !value.dateDebut || !value.dateFin || value.dateDebut <= value.dateFin, {
    message: 'dateDebut doit être <= dateFin',
    path: ['dateDebut'],
  })
  .refine(
    (value) => {
      const v = value.dateTruncValeur ?? 'month'
      const o = value.dateTruncObjectif ?? 'month'
      return isCoarserOrEqual(o, v)
    },
    {
      message: 'dateTruncObjectif doit être de granularité >= dateTruncValeur',
      path: ['dateTruncObjectif'],
    },
  )
export type ListTauxProgressionQuery = z.infer<typeof listTauxProgressionQuerySchema>

export const tauxProgressionPointApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  date: dateSchema.describe(
    'Borne inférieure du bucket de valeur (YYYY-MM-DD), alignée sur `dateTruncValeur` ' +
      '(ex. `month` → 1er du mois, `quarter` → 1er du trimestre, `year` → 1er janvier).',
  ),
  valeur: z
    .number()
    .describe(
      "Valeur d'avancement résolue à ce bucket (saisie directe ou agrégation hiérarchique).",
    ),
  valeurCible: z
    .number()
    .describe(
      "Valeur cible de l'objectif applicable à ce bucket (objectif direct ou agrégation hiérarchique).",
    ),
  dateCible: dateSchema.describe(
    "Borne inférieure du bucket d'objectif (YYYY-MM-DD), alignée sur `dateTruncObjectif`.",
  ),
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Taux de progression en pourcentage : min(100, valeur / valeurCible × 100). ' +
        'null si valeurCible vaut 0.',
    ),
})
export type TauxProgressionPointApiModel = z.infer<typeof tauxProgressionPointApiModelSchema>

export const tauxProgressionListApiModelSchema = z.object({
  items: z
    .array(tauxProgressionPointApiModelSchema)
    .describe(
      'Un point par bucket de valeur (granularité `dateTruncValeur`) pour les individus demandés ' +
        'ayant au moins un objectif. Pour les nœuds parents, la valeur et la valeurCible sont ' +
        'calculées par agrégation hiérarchique. Les individus sans objectif applicable sont absents. ' +
        'Triés par individu (publicId asc) puis par date asc.',
    ),
})
export type TauxProgressionListApiModel = z.infer<typeof tauxProgressionListApiModelSchema>
