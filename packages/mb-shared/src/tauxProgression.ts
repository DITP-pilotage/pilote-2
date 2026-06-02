import { z } from 'zod'

import { dateSchema } from './dates'
import { indicateurPublicIdSchema } from './publicIds'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'

export const listTauxProgressionQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont le bucket mensuel est >= dateDebut).',
    ),
    dateFin: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont le bucket mensuel est <= dateFin).',
    ),
  })
  .refine(
    (value) => !value.dateDebut || !value.dateFin || value.dateDebut <= value.dateFin,
    { message: 'dateDebut doit être <= dateFin', path: ['dateDebut'] },
  )
export type ListTauxProgressionQuery = z.infer<typeof listTauxProgressionQuerySchema>

export const tauxProgressionPointApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  date: dateSchema.describe('Bucket mensuel (1er du mois, YYYY-MM-01) de la valeur résolue.'),
  valeur: z
    .number()
    .describe("Valeur d'avancement résolue à ce bucket (saisie directe ou agrégation hiérarchique)."),
  valeurCible: z
    .number()
    .describe(
      "Valeur cible de l'objectif applicable à ce bucket (objectif direct ou agrégation hiérarchique).",
    ),
  dateCible: dateSchema.describe(
    "Bucket mensuel (YYYY-MM-01) de la dateCible de l'objectif applicable.",
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
      'Un point par bucket mensuel pour les individus demandés ayant au moins un objectif. ' +
        'Pour les nœuds parents, la valeur et la valeurCible sont calculées par agrégation hiérarchique. ' +
        'Les individus sans objectif applicable sont absents. ' +
        'Triés par individu (publicId asc) puis par date asc.',
    ),
})
export type TauxProgressionListApiModel = z.infer<typeof tauxProgressionListApiModelSchema>
