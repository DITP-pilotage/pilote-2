import { z } from 'zod'

import { dateSchema, dateTruncSchema } from './dates'
import { fonctionAgregationSchema, indicateurPublicIdSchema } from './indicateur'
import { individuApiModelSchema, individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'
import {
  createPaginatedApiListSchema,
  pageSizeSchema,
  paginationCursorSchema,
} from './pagination'
import { referentielPublicIdSchema } from './referentiel'

export const valeurSchema = z.number().describe('Valeur observée.')

export const valeurDateApiModelSchema = z.object({
  date: dateSchema,
  valeur: valeurSchema,
})
export type ValeurDateApiModel = z.infer<typeof valeurDateApiModelSchema>

export const upsertValeurAvancementBodySchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: valeurSchema,
})
export type UpsertValeurAvancementBody = z.infer<typeof upsertValeurAvancementBodySchema>

export const deleteValeurAvancementBodySchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
})
export type DeleteValeurAvancementBody = z.infer<typeof deleteValeurAvancementBodySchema>


export const listValeursForIndicateurQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de bucket est >= dateDebut).',
    ),
    dateFin: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de bucket est <= dateFin).',
    ),
    dateTrunc: dateTruncSchema
      .optional()
      .describe(
        'Granularité de troncature des dates des points. Par défaut `month` (limite la taille ' +
          "de réponse en regroupant les saisies du même mois). Voir `DateTrunc` pour la " +
          "sémantique des unités. S'applique aux séries saisies comme aux séries dérivées.",
      ),
  })
  .refine(
    (value) => !value.dateDebut || !value.dateFin || value.dateDebut <= value.dateFin,
    {
      message: 'dateDebut doit être <= dateFin',
      path: ['dateDebut'],
    },
  )
export type ListValeursForIndicateurQuery = z.infer<typeof listValeursForIndicateurQuerySchema>

const MAX_REFERENTIELS_PAR_REQUETE = 100

const referentielsCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant de référentiel est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(referentielPublicIdSchema)
      .min(1)
      .max(
        MAX_REFERENTIELS_PAR_REQUETE,
        `Au plus ${MAX_REFERENTIELS_PAR_REQUETE} référentiels par requête`,
      ),
  )

// Distinct de `contributionApiModelSchema` (utilisé pour le drill-down d'un
// point dérivé, plus bas) : ici on liste les individus d'un référentiel ayant
// **au moins une valeur** connue pour l'indicateur, donc `valeur` et `date`
// sont non-nullables et `source` n'inclut pas `manquante`. Les deux schemas
// se ressemblent mais leurs garanties API divergent — ne pas mutualiser sans
// relâcher le typage côté client.
export const valeursRemarquablesContributionApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  valeur: z.number().describe('Dernière valeur connue de cet individu.'),
  date: z
    .string()
    .describe(
      "Date du bucket de la dernière valeur connue (post-troncature mensuelle), " +
        "alignée sur l'unité de regroupement utilisée pour les indicateurs dérivés.",
    ),
  source: z
    .enum(['saisie', 'derivee'])
    .describe(
      "`saisie` : la valeur provient d'une saisie directe sur cet individu. " +
        "`derivee` : la valeur est reconstruite par agrégation hiérarchique des descendants.",
    ),
})
export type ValeursRemarquablesContributionApiModel = z.infer<
  typeof valeursRemarquablesContributionApiModelSchema
>

export const valeursRemarquablesReferentielApiModelSchema = z.object({
  referentiel: referentielPublicIdSchema,
  min: z
    .number()
    .nullable()
    .describe(
      "Plus petite valeur la plus récente parmi les individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  max: z
    .number()
    .nullable()
    .describe(
      "Plus grande valeur la plus récente parmi les individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  mediane: z
    .number()
    .nullable()
    .describe(
      "Médiane des valeurs les plus récentes des individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. Moyenne des deux valeurs centrales si le nombre d'individus est pair. " +
        "null si aucun individu n'a de valeur.",
    ),
  contributions: z
    .array(valeursRemarquablesContributionApiModelSchema)
    .describe(
      "Dernière valeur connue de chaque individu du référentiel ayant au moins une valeur " +
        "pour l'indicateur (triée par publicId d'individu, asc). Permet au client de reconstruire " +
        "min/max/médiane ou de faire son propre top-N / drill-down. Les individus sans aucune valeur " +
        "ne figurent pas.",
    ),
})
export type ValeursRemarquablesReferentielApiModel = z.infer<
  typeof valeursRemarquablesReferentielApiModelSchema
>

export const valeursRemarquablesListApiModelSchema = z.object({
  items: z
    .array(valeursRemarquablesReferentielApiModelSchema)
    .describe('Valeurs remarquables agrégées pour chaque référentiel demandé existant.'),
})
export type ValeursRemarquablesListApiModel = z.infer<
  typeof valeursRemarquablesListApiModelSchema
>

export const listValeursRemarquablesForIndicateurQuerySchema = z.object({
  referentiels: referentielsCsvSchema.describe(
    `Liste d'identifiants de référentiels séparés par une virgule (ex. REF-DEPT,REF-REG). 1..${MAX_REFERENTIELS_PAR_REQUETE} identifiants.`,
  ),
  dateTrunc: dateTruncSchema
    .optional()
    .describe(
      'Granularité de troncature des dates des points. Par défaut `month`. Détermine le ' +
        "bucket retenu comme « dernière valeur » de chaque individu. S'applique aux séries " +
        'saisies comme aux séries dérivées.',
    ),
})
export type ListValeursRemarquablesForIndicateurQuery = z.infer<
  typeof listValeursRemarquablesForIndicateurQuerySchema
>

export const syntheseIndividuApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  variation: z
    .number()
    .nullable()
    .describe(
      "Variation absolue entre la valeur la plus récente et la précédente (par date de la valeur). " +
        "null si l'individu n'a aucune valeur ; égale à la valeur la plus récente s'il n'en a qu'une (comparée à 0).",
    ),
  ecartMediane: z
    .number()
    .nullable()
    .describe(
      "Écart entre la valeur la plus récente de l'individu et la médiane des valeurs les plus récentes " +
        "des individus de son référentiel ayant au moins une valeur pour l'indicateur. " +
        "null si l'individu n'a aucune valeur ou si la médiane n'est pas calculable.",
    ),
})
export type SyntheseIndividuApiModel = z.infer<typeof syntheseIndividuApiModelSchema>

export const syntheseIndividusListApiModelSchema = z.object({
  items: z
    .array(syntheseIndividuApiModelSchema)
    .describe('Synthèse pour chaque individu demandé ayant été trouvé.'),
})
export type SyntheseIndividusListApiModel = z.infer<typeof syntheseIndividusListApiModelSchema>

export const listSyntheseIndividusQuerySchema = z.object({
  individus: individusCsvSchema.describe(
    `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
  ),
  dateTrunc: dateTruncSchema
    .optional()
    .describe(
      'Granularité de troncature des dates des points. Par défaut `month`. Détermine les ' +
        "buckets retenus comme « dernière » et « précédente » valeur pour le calcul de la " +
        "variation. S'applique aux séries saisies comme aux séries dérivées.",
    ),
})
export type ListSyntheseIndividusQuery = z.infer<typeof listSyntheseIndividusQuerySchema>

export const individuAvecValeursApiModelSchema = z.object({
  individu: individuApiModelSchema,
  derniereValeur: valeurDateApiModelSchema.describe(
    "Valeur la plus récente pour cet individu sur l'indicateur.",
  ),
  nombreValeurs: z
    .number()
    .int()
    .nonnegative()
    .describe("Nombre total de valeurs pour cet individu sur l'indicateur."),
})
export type IndividuAvecValeursApiModel = z.infer<typeof individuAvecValeursApiModelSchema>

export const individusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
)
export type IndividusWithValeursListApiModel = z.infer<
  typeof individusWithValeursListApiModelSchema
>

export const listIndividusWithValeursQuerySchema = z.object({
  referentiel: referentielPublicIdSchema
    .optional()
    .describe('Filtre sur la population du référentiel donné.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListIndividusWithValeursQuery = z.infer<typeof listIndividusWithValeursQuerySchema>

export const contributionSourceSchema = z
  .enum(['saisie', 'derivee', 'manquante'])
  .describe(
    "Origine de la valeur portée par un enfant direct à la date du point dérivé : `saisie` " +
      "(l'enfant est une feuille, valeur saisie connue ≤ date du bucket), `derivee` (l'enfant " +
      "est lui-même agrégé, valeur dérivée connue ≤ date du bucket), `manquante` (aucune " +
      "valeur connue pour cet enfant ≤ date du bucket).",
  )
export type ContributionSource = z.infer<typeof contributionSourceSchema>

export const contributionApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  valeur: z
    .number()
    .nullable()
    .describe(
      'Dernière valeur connue pour cet enfant ≤ date du bucket (carry-forward). null si ' +
        '`source` vaut `manquante`.',
    ),
  date: dateSchema
    .nullable()
    .describe(
      "Date associée à la valeur retenue, à des fins de debug et drill-down. Pour `saisie` : " +
        "date d'origine pré-troncature de la saisie feuille. Pour `derivee` : date du bucket du " +
        'point dérivé enfant le plus récent ≤ date du bucket courant (déjà tronquée). null si ' +
        '`manquante`.',
    ),
  source: contributionSourceSchema,
})
export type ContributionApiModel = z.infer<typeof contributionApiModelSchema>

export const couvertureApiModelSchema = z.object({
  nbEnfantsAvecValeur: z
    .number()
    .int()
    .nonnegative()
    .describe(
      'Nombre d’enfants directs ayant une valeur connue au point courant ' +
        '(source ∈ {saisie, derivee}). Évolue dans le temps.',
    ),
  nbEnfantsTotal: z
    .number()
    .int()
    .nonnegative()
    .describe('Nombre total d’enfants directs du parent.'),
})
export type CouvertureApiModel = z.infer<typeof couvertureApiModelSchema>

export const valeurSaisieApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  date: dateSchema.describe(
    "Date du point. Égale à la date de la saisie d'origine si `dateTrunc=day`, sinon date du " +
      "bucket post-troncature (la valeur retenue dans le bucket est la plus récente).",
  ),
  valeur: valeurSchema,
  type: z.literal('saisie'),
})
export type ValeurSaisieApiModel = z.infer<typeof valeurSaisieApiModelSchema>

export const valeurDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  date: dateSchema.describe(
    'Date du bucket post-troncature pour lequel le point dérivé est calculé.',
  ),
  valeur: valeurSchema.describe(
    "Résultat de l'agrégation appliquée aux contributions non manquantes à cette date.",
  ),
  type: z.literal('derivee'),
  fonctionAgregation: fonctionAgregationSchema.describe(
    "Fonction d'agrégation appliquée pour ce couple (indicateur, référentiel de l'individu).",
  ),
  contributions: z
    .array(contributionApiModelSchema)
    .describe(
      "Une entrée par enfant direct du parent, triée par publicId. Pour chaque enfant on porte " +
        "sa dernière valeur connue ≤ date du bucket (carry-forward) et la date d'origine de cette " +
        'valeur. Permet le drill-down et l’audit.',
    ),
  couverture: couvertureApiModelSchema,
})
export type ValeurDeriveeApiModel = z.infer<typeof valeurDeriveeApiModelSchema>

export const valeurAvancementApiModelSchema = z.discriminatedUnion('type', [
  valeurSaisieApiModelSchema,
  valeurDeriveeApiModelSchema,
])
export type ValeurAvancementApiModel = z.infer<typeof valeurAvancementApiModelSchema>

export const valeurAvancementListApiModelSchema = z.object({
  items: z
    .array(valeurAvancementApiModelSchema)
    .describe(
      "Points pour les individus demandés sur la plage de dates. Chaque point porte " +
        "`type: 'saisie' | 'derivee'` (discriminé). Pour les individus agrégés " +
        "(`fonctionAgregation` ≠ `NONE` sur leur référentiel pour cet indicateur), les points " +
        "sont calculés par combineLatest permissif sur les enfants directs : on émet dès qu'au " +
        'moins un enfant a une valeur connue au bucket courant. Pour les feuilles (ou ' +
        "indicateurs non agrégés), les points reflètent les saisies tronquées selon `dateTrunc`. " +
        'Triés par individu puis par date croissante.',
    ),
})
export type ValeurAvancementListApiModel = z.infer<typeof valeurAvancementListApiModelSchema>
