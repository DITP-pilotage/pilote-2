import { z } from 'zod'

import { dateSchema, dateTruncSchema } from './dates'
import { fonctionAgregationSchema } from './indicateur'
import { indicateursCsvSchema, MAX_INDICATEURS_PAR_REQUETE } from './indicateursCsv'

// Ré-export pour les consommateurs front qui plafonnent leur taille de batch
// sur la même valeur que celle imposée par l'API.
export { MAX_INDICATEURS_PAR_REQUETE } from './indicateursCsv'
import { indicateurPublicIdSchema } from './publicIds'
import { celluleIdSchema, coordonneesSchema } from './cellule'
import { dimensionPublicIdSchema } from './dimension'
import { individuApiModelSchema, individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'
import { createPaginatedApiListSchema, pageSizeSchema, paginationCursorSchema } from './pagination'
import { referentielPublicIdSchema } from './referentiel'

export const valeurSchema = z.number().describe('Valeur observée.')

export const valeurDateApiModelSchema = z.object({
  date: dateSchema,
  valeur: valeurSchema,
})
export type ValeurDateApiModel = z.infer<typeof valeurDateApiModelSchema>

// Une valeur se saisit sur une cellule **complète** : `individu` (forme
// historique, cellule à une coordonnée) ou `coordonnees` (un membre par dimension
// de l'indicateur). Exactement l'un des deux.
const ciblerCelluleSchema = {
  individu: individuPublicIdSchema
    .optional()
    .describe('Forme historique : individu cible (indicateur mono-dimension).'),
  coordonnees: coordonneesSchema.optional(),
}
const exactementUneCible = (body: {
  individu?: string | undefined
  coordonnees?: string[] | undefined
}) => (body.individu === undefined) !== (body.coordonnees === undefined)
const messageUneCible = {
  message: 'Renseigner exactement un champ parmi `individu` et `coordonnees`',
  path: ['coordonnees'],
}

export const upsertValeurAvancementBodySchema = z
  .object({
    ...ciblerCelluleSchema,
    date: dateSchema,
    valeur: valeurSchema,
  })
  .refine(exactementUneCible, messageUneCible)
export type UpsertValeurAvancementBody = z.infer<typeof upsertValeurAvancementBodySchema>

export const deleteValeurAvancementBodySchema = z
  .object({
    ...ciblerCelluleSchema,
    date: dateSchema,
  })
  .refine(exactementUneCible, messageUneCible)
export type DeleteValeurAvancementBody = z.infer<typeof deleteValeurAvancementBodySchema>

export const MAX_VALEURS_PAR_BATCH = 1000

export const upsertValeursAvancementBatchBodySchema = z.object({
  items: z
    .array(upsertValeurAvancementBodySchema)
    .min(1, 'Au moins une entrée est requise')
    .max(MAX_VALEURS_PAR_BATCH, `Au plus ${MAX_VALEURS_PAR_BATCH} entrées par requête`)
    .describe(
      `Entrées à upserter sur l'indicateur (clé unique \`(cellule, date)\`, cellule = \`individu\` ou \`coordonnees\`). 1..${MAX_VALEURS_PAR_BATCH} entrées.`,
    ),
})
export type UpsertValeursAvancementBatchBody = z.infer<
  typeof upsertValeursAvancementBatchBodySchema
>

export const upsertValeursAvancementBatchResultApiModelSchema = z.object({
  total: z.number().int().nonnegative().describe('Nombre total d’entrées traitées.'),
  created: z
    .number()
    .int()
    .nonnegative()
    .describe('Nombre d’entrées nouvellement créées dans la base.'),
  updated: z
    .number()
    .int()
    .nonnegative()
    .describe('Nombre d’entrées préexistantes dont la valeur a été remplacée.'),
})
export type UpsertValeursAvancementBatchResultApiModel = z.infer<
  typeof upsertValeursAvancementBatchResultApiModelSchema
>

export const batchInvalidIssueApiModelSchema = z.object({
  path: z
    .string()
    .describe(
      "Chemin Zod relatif à l'item (ex. `valeur`, `individu`). Vide si l'erreur porte sur l'item entier.",
    ),
  message: z.string().describe('Message Zod en français.'),
})
export type BatchInvalidIssueApiModel = z.infer<typeof batchInvalidIssueApiModelSchema>

export const batchInvalidErrorEntryApiModelSchema = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('INVALID_ITEM'),
    indices: z
      .array(z.number().int().nonnegative())
      .min(1)
      .describe("Index (toujours 1 élément pour INVALID_ITEM) de l'item invalide dans `items`."),
    issues: z
      .array(batchInvalidIssueApiModelSchema)
      .min(1)
      .describe("Liste des problèmes Zod détectés sur l'item."),
  }),
  z.object({
    code: z.literal('INDIVIDU_INCONNU'),
    indices: z
      .array(z.number().int().nonnegative())
      .min(1)
      .describe(
        'Tous les index où cet individu apparaît (l’individu est inconnu ou non lié à l’indicateur).',
      ),
    individu: individuPublicIdSchema,
  }),
  z.object({
    code: z.literal('DUPLICATE_KEY'),
    indices: z
      .array(z.number().int().nonnegative())
      .min(2)
      .describe(
        'Les index où le couple `(cellule, date)` apparaît (au moins 2), cellule comparée sous sa forme canonique.',
      ),
    individu: celluleIdSchema.describe('Cellule canonique en doublon.'),
    date: dateSchema,
  }),
  z.object({
    code: z.literal('COORDONNEE_MANQUANTE'),
    indices: z.array(z.number().int().nonnegative()).min(1),
    dimension: dimensionPublicIdSchema.describe(
      "Dimension de l'indicateur sans coordonnée : une valeur se saisit sur une cellule complète.",
    ),
  }),
  z.object({
    code: z.literal('DIMENSION_NON_DECLAREE'),
    indices: z.array(z.number().int().nonnegative()).min(1),
    individu: individuPublicIdSchema.describe(
      "Membre existant dont la dimension n'est pas déclarée sur l'indicateur.",
    ),
  }),
  z.object({
    code: z.literal('COORDONNEES_EN_DOUBLE'),
    indices: z.array(z.number().int().nonnegative()).min(1),
    dimension: dimensionPublicIdSchema.describe(
      'Dimension portant plusieurs membres dans la même cellule.',
    ),
  }),
  z.object({
    code: z.literal('CELLULE_AGREGEE'),
    indices: z.array(z.number().int().nonnegative()).min(1),
    individu: individuPublicIdSchema.describe(
      'Membre agrégé (il a des enfants) : la cellule est dérivée, on saisit ses membres feuilles.',
    ),
  }),
  z.object({
    code: z.literal('HORS_PERIMETRE'),
    indices: z.array(z.number().int().nonnegative()).min(1),
    individu: celluleIdSchema.describe(
      "Cellule hors du périmètre d'écriture du principal (cloisonnement par membre de dimension).",
    ),
  }),
])
export type BatchInvalidErrorEntryApiModel = z.infer<typeof batchInvalidErrorEntryApiModelSchema>

export const batchInvalidErrorDetailsApiModelSchema = z.object({
  errors: z
    .array(batchInvalidErrorEntryApiModelSchema)
    .min(1)
    .describe(
      'Liste exhaustive des erreurs détectées. Toutes les erreurs sont remontées en une fois ' +
        '(pas de plafond). Aucune valeur n’a été appliquée.',
    ),
})
export type BatchInvalidErrorDetailsApiModel = z.infer<
  typeof batchInvalidErrorDetailsApiModelSchema
>

export const listValeursForIndicateurQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema
      .optional()
      .describe(
        'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de bucket est >= dateDebut).',
      ),
    dateFin: dateSchema
      .optional()
      .describe(
        'Date ISO YYYY-MM-DD inclusive (filtre les points dont la date de bucket est <= dateFin).',
      ),
    dateTrunc: dateTruncSchema
      .optional()
      .describe(
        'Granularité de troncature des dates des points. Par défaut `month` (limite la taille ' +
          'de réponse en regroupant les saisies du même mois). Voir `DateTrunc` pour la ' +
          "sémantique des unités. S'applique aux séries saisies comme aux séries dérivées.",
      ),
  })
  .refine((value) => !value.dateDebut || !value.dateFin || value.dateDebut <= value.dateFin, {
    message: 'dateDebut doit être <= dateFin',
    path: ['dateDebut'],
  })
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
  individu: celluleIdSchema,
  valeur: z.number().describe('Dernière valeur connue de cet individu.'),
  date: z
    .string()
    .describe(
      'Date du bucket de la dernière valeur connue (post-troncature mensuelle), ' +
        "alignée sur l'unité de regroupement utilisée pour les indicateurs dérivés.",
    ),
  source: z
    .enum(['saisie', 'derivee'])
    .describe(
      "`saisie` : la valeur provient d'une saisie directe sur cet individu. " +
        '`derivee` : la valeur est reconstruite par agrégation hiérarchique des descendants.',
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
      'Plus petite valeur la plus récente parmi les individus du référentiel ayant au moins une valeur ' +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  max: z
    .number()
    .nullable()
    .describe(
      'Plus grande valeur la plus récente parmi les individus du référentiel ayant au moins une valeur ' +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  mediane: z
    .number()
    .nullable()
    .describe(
      'Médiane des valeurs les plus récentes des individus du référentiel ayant au moins une valeur ' +
        "pour l'indicateur. Moyenne des deux valeurs centrales si le nombre d'individus est pair. " +
        "null si aucun individu n'a de valeur.",
    ),
  contributions: z
    .array(valeursRemarquablesContributionApiModelSchema)
    .describe(
      'Dernière valeur connue de chaque individu du référentiel ayant au moins une valeur ' +
        "pour l'indicateur (triée par publicId d'individu, asc). Permet au client de reconstruire " +
        'min/max/médiane ou de faire son propre top-N / drill-down. Les individus sans aucune valeur ' +
        'ne figurent pas.',
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
export type ValeursRemarquablesListApiModel = z.infer<typeof valeursRemarquablesListApiModelSchema>

export const listValeursRemarquablesForIndicateurQuerySchema = z.object({
  referentiels: referentielsCsvSchema.describe(
    `Liste d'identifiants de référentiels séparés par une virgule (ex. REF-DEPT,REF-REG). 1..${MAX_REFERENTIELS_PAR_REQUETE} identifiants.`,
  ),
  fixe: celluleIdSchema
    .optional()
    .describe(
      'Indicateur multi-dimension : coordonnées fixées des autres dimensions (cellule partielle, ex. ' +
        '`OP-ORANGE`). La population d’un référentiel R est alors la **tranche** « membres de R × fixe ». ' +
        'Absent : les autres dimensions sont marginales (« tous »). Une coordonnée de la dimension de R est ignorée.',
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
  individu: celluleIdSchema,
  variation: z
    .number()
    .nullable()
    .describe(
      'Variation absolue entre la valeur la plus récente et la précédente (par date de la valeur). ' +
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
        'buckets retenus comme « dernière » et « précédente » valeur pour le calcul de la ' +
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
    'Origine de la valeur portée par un enfant direct à la date du point dérivé : `saisie` ' +
      "(l'enfant est une feuille, valeur saisie connue ≤ date du bucket), `derivee` (l'enfant " +
      'est lui-même agrégé, valeur dérivée connue ≤ date du bucket), `manquante` (aucune ' +
      'valeur connue pour cet enfant ≤ date du bucket).',
  )
export type ContributionSource = z.infer<typeof contributionSourceSchema>

export const contributionApiModelSchema = z.object({
  individu: celluleIdSchema,
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
      'Date associée à la valeur retenue, à des fins de debug et drill-down. Pour `saisie` : ' +
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
  individu: celluleIdSchema,
  date: dateSchema.describe(
    "Date du point. Égale à la date de la saisie d'origine si `dateTrunc=day`, sinon date du " +
      'bucket post-troncature (la valeur retenue dans le bucket est la plus récente).',
  ),
  valeur: valeurSchema,
  type: z.literal('saisie'),
})
export type ValeurSaisieApiModel = z.infer<typeof valeurSaisieApiModelSchema>

export const valeurDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: celluleIdSchema,
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
      'Une entrée par enfant direct du parent, triée par publicId. Pour chaque enfant on porte ' +
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
      'Points pour les individus demandés sur la plage de dates. Chaque point porte ' +
        "`type: 'saisie' | 'derivee'` (discriminé). Pour les individus agrégés " +
        '(`fonctionAgregation` ≠ `NONE` sur leur référentiel pour cet indicateur), les points ' +
        "sont calculés par combineLatest permissif sur les enfants directs : on émet dès qu'au " +
        'moins un enfant a une valeur connue au bucket courant. Pour les feuilles (ou ' +
        'indicateurs non agrégés), les points reflètent les saisies tronquées selon `dateTrunc`. ' +
        'Triés par individu puis par date croissante.',
    ),
})
export type ValeurAvancementListApiModel = z.infer<typeof valeurAvancementListApiModelSchema>

export const dernierValeurIndividuApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  valeur: valeurSchema.describe("Dernière valeur connue de l'individu pour cet indicateur."),
  date: dateSchema.describe(
    'Date du bucket de la dernière valeur connue (post-troncature mensuelle).',
  ),
  type: z
    .enum(['saisie', 'derivee'])
    .describe(
      "`saisie` : la valeur provient d'une saisie directe sur cet individu. " +
        '`derivee` : la valeur est reconstruite par agrégation hiérarchique des descendants.',
    ),
})
export type DernierValeurIndividuApiModel = z.infer<typeof dernierValeurIndividuApiModelSchema>

export const dernieresValeursIndividuListApiModelSchema = z.object({
  items: z
    .array(dernierValeurIndividuApiModelSchema)
    .describe(
      "Dernière valeur connue de l'individu pour chaque indicateur demandé ayant au moins une " +
        'valeur. Les indicateurs sans valeur connue pour cet individu sont omis de la réponse.',
    ),
})
export type DernieresValeursIndividuListApiModel = z.infer<
  typeof dernieresValeursIndividuListApiModelSchema
>

export const listDernieresValeursForIndividuQuerySchema = z.object({
  indicateurs: indicateursCsvSchema.describe(
    `Liste d'identifiants d'indicateurs séparés par une virgule (ex. IND-A,IND-B). 1..${MAX_INDICATEURS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListDernieresValeursForIndividuQuery = z.infer<
  typeof listDernieresValeursForIndividuQuerySchema
>

export const listTauxProgressionIndividuQuerySchema = z.object({
  indicateurs: indicateursCsvSchema.describe(
    `Liste d'identifiants d'indicateurs séparés par une virgule (ex. IND-A,IND-B). 1..${MAX_INDICATEURS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListTauxProgressionIndividuQuery = z.infer<
  typeof listTauxProgressionIndividuQuerySchema
>

export const tauxProgressionIndividuApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      "Taux de progression vers l'objectif courant (0–100), null si aucun objectif n'est défini " +
        'pour cet indicateur × individu ou si la valeur cible est zéro.',
    ),
  valeurCible: z
    .number()
    .describe("Valeur cible de l'objectif courant pour cet indicateur × individu."),
  dateCible: dateSchema.describe(
    "Date cible de l'objectif courant (YYYY-MM-DD) pour cet indicateur × individu.",
  ),
})
export type TauxProgressionIndividuApiModel = z.infer<typeof tauxProgressionIndividuApiModelSchema>

export const tauxProgressionIndividuListApiModelSchema = z.object({
  items: z
    .array(tauxProgressionIndividuApiModelSchema)
    .describe(
      'Taux de progression pour chaque indicateur demandé ayant un objectif défini et une valeur connue. ' +
        'Les indicateurs sans objectif ou sans valeur sont omis. ' +
        'Les indicateurs dont la valeurCible est zéro sont inclus avec tauxProgression: null.',
    ),
})
export type TauxProgressionIndividuListApiModel = z.infer<
  typeof tauxProgressionIndividuListApiModelSchema
>
