import { z } from 'zod'

import { dateSchema } from './dates'
import { individuPublicIdSchema } from './individu'
import { dossierPublicIdSchema, indicateurPublicIdSchema } from './publicIds'

export const MAX_DOSSIERS_PAR_REQUETE = 50

const dossiersCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant de dossier est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(dossierPublicIdSchema)
      .min(1)
      .max(MAX_DOSSIERS_PAR_REQUETE, `Au plus ${MAX_DOSSIERS_PAR_REQUETE} dossiers par requête`),
  )

export const listDossierTauxProgressionForIndividuQuerySchema = z.object({
  dossiers: dossiersCsvSchema.describe(
    `Liste d'identifiants de dossiers séparés par une virgule (ex. DOS-1,DOS-2). 1..${MAX_DOSSIERS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListDossierTauxProgressionForIndividuQuery = z.infer<
  typeof listDossierTauxProgressionForIndividuQuerySchema
>

export const dossierTauxProgressionSummaryApiModelSchema = z.object({
  dossier: dossierPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs du dossier, tronquée à 2 décimales. ' +
        "null si au moins un indicateur du dossier n'est pas calculable (règle tout-ou-rien) ou si " +
        'le dossier est vide.',
    ),
})
export type DossierTauxProgressionSummaryApiModel = z.infer<
  typeof dossierTauxProgressionSummaryApiModelSchema
>

export const dossierTauxProgressionSummaryListApiModelSchema = z.object({
  items: z
    .array(dossierTauxProgressionSummaryApiModelSchema)
    .describe(
      'Taux de progression pour chaque dossier demandé accessible en lecture. ' +
        'Les dossiers inaccessibles ou inexistants sont omis.',
    ),
})
export type DossierTauxProgressionSummaryListApiModel = z.infer<
  typeof dossierTauxProgressionSummaryListApiModelSchema
>

export const getDossierTauxProgressionQuerySchema = z.object({
  individu: individuPublicIdSchema.describe(
    "Identifiant public de l'individu pour lequel calculer le taux de progression du dossier.",
  ),
})
export type GetDossierTauxProgressionQuery = z.infer<typeof getDossierTauxProgressionQuerySchema>

export const dossierTauxProgressionContributionApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Dernier taux de progression connu pour cet indicateur et cet individu. ' +
        "null si l'indicateur n'a aucun point calculable (pas d'objectif, pas de valeur, " +
        'ou dernier point avec valeurCible = 0).',
    ),
  date: dateSchema
    .nullable()
    .describe(
      'Bucket (YYYY-MM-DD) du dernier point retenu pour cet indicateur. null si aucun point.',
    ),
  ponderation: z
    .number()
    .describe(
      'Pondération appliquée à cet indicateur dans la moyenne pondérée du dossier. Fixé à 1 en v0.',
    ),
})
export type DossierTauxProgressionContributionApiModel = z.infer<
  typeof dossierTauxProgressionContributionApiModelSchema
>

export const dossierTauxProgressionApiModelSchema = z.object({
  dossier: dossierPublicIdSchema,
  individu: individuPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs du dossier, tronquée à 2 décimales. ' +
        "null si au moins un indicateur du dossier n'est pas calculable (règle tout-ou-rien) ou si " +
        'le dossier est vide.',
    ),
  contributions: z
    .array(dossierTauxProgressionContributionApiModelSchema)
    .describe(
      "Détail par indicateur du dossier (dernier taux connu pour l'individu, date, pondération). " +
        'Toujours renseigné même si la moyenne globale est null — utile pour expliciter au client ' +
        'quels indicateurs bloquent le calcul.',
    ),
})
export type DossierTauxProgressionApiModel = z.infer<typeof dossierTauxProgressionApiModelSchema>
