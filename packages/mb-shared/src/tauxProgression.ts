import { z } from 'zod'

import { dateSchema } from './dates'
import { indicateurPublicIdSchema } from './indicateur'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'

export const listTauxProgressionQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de saisie est >= dateDebut).',
    ),
    dateFin: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de saisie est <= dateFin).',
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
  date: dateSchema.describe('Date brute de la saisie (YYYY-MM-DD), sans troncature.'),
  valeur: z.number().describe("Valeur d'avancement à cette date."),
  valeurCible: z.number().describe("Valeur cible de l'objectif applicable à cette date."),
  dateCible: dateSchema.describe("Date cible de l'objectif applicable."),
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
      "Un point par saisie des individus demandés ayant au moins un objectif. " +
        "Les individus sans objectif sont absents. Triés par individu (publicId asc) puis par date asc.",
    ),
})
export type TauxProgressionListApiModel = z.infer<typeof tauxProgressionListApiModelSchema>
