import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/mb-shared/publicIds'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import {
  batchInvalidErrorDetailsApiModelSchema,
  deleteValeurAvancementBodySchema,
  dernieresValeursIndividuListApiModelSchema,
  individuAvecValeursApiModelSchema,
  listDernieresValeursForIndividuQuerySchema,
  listIndividusWithValeursQuerySchema,
  listSyntheseIndividusQuerySchema,
  listTauxProgressionIndividuQuerySchema,
  listValeursForIndicateurQuerySchema,
  listValeursRemarquablesForIndicateurQuerySchema,
  syntheseIndividusListApiModelSchema,
  tauxProgressionIndividuListApiModelSchema,
  upsertValeurAvancementBodySchema,
  upsertValeursAvancementBatchBodySchema,
  upsertValeursAvancementBatchResultApiModelSchema,
  valeurAvancementListApiModelSchema,
  valeurSaisieApiModelSchema,
  valeursRemarquablesListApiModelSchema,
} from '@pilote/mb-shared/valeurAvancement'
import {
  listTauxProgressionQuerySchema,
  tauxProgressionListApiModelSchema,
} from '@pilote/mb-shared/tauxProgression'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur403 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { deleteValeurAvancement } from '@/valeurAvancement/commands/deleteValeurAvancement'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { upsertValeursAvancementBatch } from '@/valeurAvancement/commands/upsertValeursAvancementBatch'
import { listDernieresValeursForIndividu } from '@/valeurAvancement/queries/listDernieresValeursForIndividu'
import { listTauxProgressionForIndividu } from '@/valeurAvancement/queries/listTauxProgressionForIndividu'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'
import { listSyntheseIndividus } from '@/valeurAvancement/queries/listSyntheseIndividus'
import { listTauxProgressionForIndicateur } from '@/valeurAvancement/queries/listTauxProgressionForIndicateur'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

const ValeurSaisieApiModelSchema = valeurSaisieApiModelSchema.openapi('ValeurSaisieApiModel')
const ValeurAvancementListApiModelSchema = valeurAvancementListApiModelSchema.openapi(
  'ValeurAvancementListApiModel',
)
const UpsertValeurAvancementBodySchema = upsertValeurAvancementBodySchema.openapi(
  'UpsertValeurAvancementBody',
)
const DeleteValeurAvancementBodySchema = deleteValeurAvancementBodySchema.openapi(
  'DeleteValeurAvancementBody',
)
const UpsertValeursAvancementBatchBodySchema = upsertValeursAvancementBatchBodySchema.openapi(
  'UpsertValeursAvancementBatchBody',
)
const UpsertValeursAvancementBatchResultApiModelSchema =
  upsertValeursAvancementBatchResultApiModelSchema.openapi(
    'UpsertValeursAvancementBatchResultApiModel',
  )
const BatchInvalidErrorDetailsApiModelSchema = batchInvalidErrorDetailsApiModelSchema.openapi(
  'BatchInvalidErrorDetailsApiModel',
)
const BatchInvalidErrorApiModelSchema = errorApiModelSchema
  .extend({ details: BatchInvalidErrorDetailsApiModelSchema })
  .openapi('BatchInvalidErrorApiModel')
const IndividusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
).openapi('IndividusWithValeursListApiModel')
const ValeursRemarquablesListApiModelSchema = valeursRemarquablesListApiModelSchema.openapi(
  'ValeursRemarquablesListApiModel',
)
const SyntheseIndividusListApiModelSchema = syntheseIndividusListApiModelSchema.openapi(
  'SyntheseIndividusListApiModel',
)
const DernieresValeursIndividuListApiModelSchema =
  dernieresValeursIndividuListApiModelSchema.openapi('DernieresValeursIndividuListApiModel')
const TauxProgressionListApiModelSchema = tauxProgressionListApiModelSchema.openapi(
  'TauxProgressionListApiModel',
)
const TauxProgressionIndividuListApiModelSchema = tauxProgressionIndividuListApiModelSchema.openapi(
  'TauxProgressionIndividuListApiModel',
)

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/valeurs --------------------------------------------

const getValeursForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs (saisies ou dérivées) pour un indicateur sur des individus',
  description:
    "Retourne les points (saisies ou dérivés par agrégation hiérarchique) pour l'indicateur sur " +
    'la liste d’individus fournie. Le paramètre `individus` est obligatoire (1..N identifiants ' +
    'séparés par une virgule, ex. `DEPT-84,DEPT-13`). Filtres optionnels `dateDebut`/`dateFin` ' +
    '(ISO `YYYY-MM-DD`, inclusifs, comparés à la date de bucket des points). Paramètre optionnel ' +
    '`dateTrunc` pour tronquer les dates (`month` par défaut ; `day|week|quarter|year`). ' +
    "Chaque item porte `type: 'saisie' | 'derivee'`. Pour les individus agrégés " +
    '(`fonctionAgregation` ≠ `NONE` sur leur référentiel pour cet indicateur), les points dérivés ' +
    'incluent les contributions des enfants directs et la couverture du calcul. Sémantique ' +
    "combineLatest permissive : un point dérivé est émis dès qu'au moins un enfant a une valeur " +
    'connue au bucket courant ; les enfants sans valeur sont marqués `manquante`. ' +
    'Profondeur d’agrégation supportée : France → Régions → Départements (~100 feuilles). ' +
    'Au-delà la requête est acceptée mais peut être lente.',
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listValeursForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeurAvancementListApiModelSchema } },
      description: 'Points (saisies et dérivés) pour les individus demandés',
    },
    400: erreur400,
  },
})

// --- PUT /indicateurs/:id/valeurs --------------------------------------------

const upsertValeurAvancementRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Saisir ou mettre à jour une valeur ponctuelle pour un individu',
  description:
    "Upsert d'une valeur unique sur la clé `(indicateur, individu, date)`. Si le triplet existe, la `valeur` est remplacée ; sinon une nouvelle valeur est créée. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertValeurAvancementBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeurSaisieApiModelSchema } },
      description: 'Valeur saisie créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
  },
})

// --- DELETE /indicateurs/:id/valeurs -----------------------------------------

const deleteValeurAvancementRoute = createRoute({
  method: 'delete',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Supprimer une valeur ponctuelle pour un individu',
  description:
    "Supprime la valeur identifiée par `(indicateur, individu, date)`. Idempotent : retourne `204` même si la valeur n'existait pas. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: DeleteValeurAvancementBodySchema } },
      required: true,
    },
  },
  responses: {
    204: {
      description: 'Valeur supprimée (ou inexistante — idempotent)',
    },
    400: erreur400,
    403: erreur403,
  },
})

// --- PUT /indicateurs/:id/valeurs:batch --------------------------------------

const upsertValeursAvancementBatchRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/valeurs:batch',
  tags: ['Indicateur'],
  summary: 'Saisir ou mettre à jour un lot de valeurs pour un indicateur',
  description:
    "Upsert atomique d'un lot de valeurs (1..1000) sur la clé `(indicateur, individu, date)`. " +
    'Tout-ou-rien : si une seule entrée est invalide (individu inconnu/non lié, doublon `(individu, date)` ' +
    'dans le payload), aucune valeur n’est appliquée et la réponse 400 `BATCH_INVALID` liste ' +
    'exhaustivement les erreurs détectées (agrégées par cause avec leurs `indices` dans `items`).',
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertValeursAvancementBatchBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: UpsertValeursAvancementBatchResultApiModelSchema },
      },
      description: 'Lot appliqué. Compteurs `total`, `created`, `updated`.',
    },
    400: {
      content: {
        'application/json': {
          schema: z.union([BatchInvalidErrorApiModelSchema, ErrorApiModelSchema]),
        },
      },
      description:
        "Lot invalide. Aucune valeur n'a été appliquée. " +
        '`BATCH_INVALID` (lot rejeté par la validation métier) — `details.errors` détaille les causes ' +
        '(`INVALID_ITEM`, `INDIVIDU_INCONNU`, `DUPLICATE_KEY`) avec leurs `indices` dans `items`. ' +
        '`VALIDATION_ERROR` (payload JSON/schema invalide en amont du handler).',
    },
    403: erreur403,
  },
})

// --- GET /indicateurs/:id/individus ------------------------------------------

const getIndividusWithValeursRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/individus',
  tags: ['Indicateur'],
  summary: 'Lister les individus disposant de valeurs pour un indicateur',
  description:
    "Retourne la liste paginée des individus ayant au moins une valeur pour l'indicateur. Filtre optionnel `referentiel` pour ne conserver que les individus appartenant à la population d'un référentiel donné. Chaque item inclut la dernière valeur et le nombre total de valeurs.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listIndividusWithValeursQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividusWithValeursListApiModelSchema } },
      description: "Individus avec valeurs pour l'indicateur",
    },
    400: erreur400,
  },
})

// --- GET /indicateurs/:id/valeurs-remarquables -------------------------------

const getValeursRemarquablesForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs-remarquables',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs remarquables pour un indicateur par référentiel',
  description:
    "Retourne, pour chaque référentiel demandé existant, les stats `min`/`max`/`mediane` calculées sur la valeur la plus récente de chaque individu du référentiel ayant au moins une valeur pour l'indicateur. " +
    'Le paramètre `referentiels` est obligatoire (1..N identifiants séparés par une virgule, ex. `REF-DEPT,REF-REG`). ' +
    'Les référentiels inexistants sont omis de la réponse. ' +
    "Si un référentiel n'a aucun individu avec valeur pour l'indicateur, les trois champs sont à `null` mais l'item est présent.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listValeursRemarquablesForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeursRemarquablesListApiModelSchema } },
      description: 'Valeurs remarquables agrégées pour les référentiels demandés',
    },
    400: erreur400,
  },
})

// --- GET /indicateurs/:id/synthese-individus ---------------------------------

const getSyntheseIndividusRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/synthese-individus',
  tags: ['Indicateur'],
  summary: 'Lister la synthèse pour un indicateur sur des individus',
  description:
    'Retourne, pour chaque individu demandé existant, sa variation depuis la dernière mise à jour et son écart à la médiane de son référentiel. ' +
    'Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `DEPT-84,DEPT-13`). ' +
    'Les individus inexistants sont omis de la réponse. ' +
    'La variation est calculée sur la base de la date de la valeur (pas de la date de saisie) : null si aucune valeur, ' +
    'égale à la valeur la plus récente si une seule (comparée à 0), sinon différence avec la valeur précédente. ' +
    "L'écart à la médiane est calculé par rapport à la médiane des valeurs récentes des individus du même référentiel " +
    "ayant au moins une valeur pour l'indicateur ; null si l'individu n'a aucune valeur.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listSyntheseIndividusQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SyntheseIndividusListApiModelSchema } },
      description: 'Synthèse pour les individus demandés',
    },
    400: erreur400,
  },
})

// --- GET /individus/:id/dernieres-valeurs ------------------------------------

const individuParamsSchema = z.object({
  id: individuPublicIdSchema,
})

const getDernieresValeursForIndividuRoute = createRoute({
  method: 'get',
  path: '/individus/{id}/dernieres-valeurs',
  tags: ['Individu'],
  summary: "Lister la dernière valeur connue de l'individu pour un lot d'indicateurs",
  description:
    'Retourne, pour chaque indicateur demandé accessible en lecture, la dernière valeur ' +
    "connue de l'individu (saisie ou dérivée par agrégation hiérarchique). Le paramètre " +
    '`indicateurs` est obligatoire (1..N identifiants séparés par une virgule, ex. ' +
    '`IND-A,IND-B`). Les indicateurs sans valeur connue pour cet individu ou non accessibles ' +
    'sont omis de la réponse. Granularité de troncature `month`. Endpoint pensé pour des ' +
    "appels batch côté client (afficher l'avancement sur une liste de cartes d'indicateurs).",
  middleware: [requireAuthentication],
  request: {
    params: individuParamsSchema,
    query: listDernieresValeursForIndividuQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DernieresValeursIndividuListApiModelSchema } },
      description: 'Dernières valeurs pour les indicateurs demandés',
    },
    400: erreur400,
  },
})

// --- GET /individus/:id/taux-progression -------------------------------------

const getTauxProgressionForIndividuRoute = createRoute({
  method: 'get',
  path: '/individus/{id}/taux-progression',
  tags: ['Individu'],
  summary: "Lister le taux de progression de l'individu pour un lot d'indicateurs",
  description:
    'Retourne, pour chaque indicateur demandé accessible en lecture, le taux de progression ' +
    "calculé sur la dernière valeur connue de l'individu (`min(100, valeur / valeurCible × 100)`, " +
    'tronqué à 2 décimales). Les indicateurs sans objectif défini ou sans valeur connue sont omis. ' +
    'Les indicateurs dont la valeurCible est zéro sont inclus avec `tauxProgression: null`. ' +
    'Endpoint pensé pour des appels batch côté client en parallèle de `dernieres-valeurs`.',
  middleware: [requireAuthentication],
  request: {
    params: individuParamsSchema,
    query: listTauxProgressionIndividuQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: TauxProgressionIndividuListApiModelSchema },
      },
      description: 'Taux de progression pour les indicateurs demandés',
    },
    400: erreur400,
  },
})

// --- GET /indicateurs/:id/taux-progression -----------------------------------

const getTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/taux-progression',
  tags: ['Indicateur'],
  summary: 'Lister le taux de progression par bucket pour des individus',
  description:
    'Retourne, pour chaque bucket de valeur des individus demandés, le taux de progression ' +
    'calculé comme `min(100, valeur / valeurCible × 100)`, tronqué à 2 décimales (jamais ' +
    '100 % avant atteinte stricte de la cible). La valeur et la valeurCible sont résolues par ' +
    'agrégation hiérarchique (cf. doc `indicateur-derives.md` / `objectifs-derives.md`) ' +
    "lorsque l'individu est un nœud parent. La granularité des buckets est paramétrable " +
    'indépendamment pour les valeurs (`dateTruncValeur`) et les objectifs (`dateTruncObjectif`), ' +
    'avec la contrainte `dateTruncObjectif >= dateTruncValeur`. ' +
    "L'objectif applicable est le premier objectif dont `dateCible` (bucketisée) est ≥ date " +
    'du bucket de valeur ; si le bucket est postérieur à tous les objectifs, le dernier ' +
    'objectif connu est retenu. Les individus sans aucun objectif applicable sont absents ' +
    'de la réponse. Triés par `(individu publicId asc, date asc)`.',
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TauxProgressionListApiModelSchema } },
      description: 'Taux de progression pour les individus demandés',
    },
    400: erreur400,
  },
})

// --- App registration --------------------------------------------------------

export const valeurAvancementRoutes = new OpenAPIHono()

valeurAvancementRoutes.openapi(getValeursForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus, dateDebut, dateFin, dateTrunc } = context.req.valid('query')

  return listValeursForIndicateur(id, { individus, dateDebut, dateFin, dateTrunc }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeurAvancementListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(upsertValeurAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    upsertValeurAvancement({ indicateurPublicId: id, body }),
  )

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeurSaisieApiModelSchema,
        status: 200,
      }),
    (error) =>
      jsonResponseError({
        context,
        error: {
          code: error.type,
          message:
            "L'individu est inconnu ou n'est pas rattaché à un référentiel lié à l'indicateur",
          details: { individu: error.individu },
        },
        schema: ErrorApiModelSchema,
        status: 400,
      }),
  )
})

valeurAvancementRoutes.openapi(deleteValeurAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    deleteValeurAvancement({ indicateurPublicId: id, body }),
  )

  return result.match(
    () => context.body(null, 204),
    (error) =>
      jsonResponseError({
        context,
        error: {
          code: error.type,
          message:
            "L'individu est inconnu ou n'est pas rattaché à un référentiel lié à l'indicateur",
          details: { individu: error.individu },
        },
        schema: ErrorApiModelSchema,
        status: 400,
      }),
  )
})

valeurAvancementRoutes.openapi(upsertValeursAvancementBatchRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    upsertValeursAvancementBatch(id, { items: body.items }),
  )

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: UpsertValeursAvancementBatchResultApiModelSchema,
        status: 200,
      }),
    (error) =>
      jsonResponseError({
        context,
        error: {
          code: error.type,
          message: "Aucune valeur n'a été appliquée.",
          details: { errors: error.errors },
        },
        schema: BatchInvalidErrorApiModelSchema,
        status: 400,
      }),
  )
})

valeurAvancementRoutes.openapi(getIndividusWithValeursRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { referentiel, cursor, pageSize } = context.req.valid('query')

  return listIndividusWithValeurs(id, { referentiel, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividusWithValeursListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getValeursRemarquablesForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { referentiels, dateTrunc } = context.req.valid('query')

  return listValeursRemarquablesForIndicateur(id, { referentiels, dateTrunc }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeursRemarquablesListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getSyntheseIndividusRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus, dateTrunc } = context.req.valid('query')

  return listSyntheseIndividus(id, { individus, dateTrunc }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: SyntheseIndividusListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getDernieresValeursForIndividuRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { indicateurs } = context.req.valid('query')

  return listDernieresValeursForIndividu(id, { indicateurs }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DernieresValeursIndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getTauxProgressionForIndividuRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { indicateurs } = context.req.valid('query')

  return listTauxProgressionForIndividu(id, { indicateurs }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: TauxProgressionIndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return listTauxProgressionForIndicateur(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: TauxProgressionListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
