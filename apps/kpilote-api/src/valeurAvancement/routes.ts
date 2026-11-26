import { createRoute, z } from '@hono/zod-openapi'
import { errorApiModelSchema, validationErrorApiModelSchema } from '@pilote/kpilote-shared/error'
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import {
  batchInvalidErrorDetailsApiModelSchema,
  deleteValeurAvancementBodySchema,
  dernieresValeursListApiModelSchema,
  derniersTauxProgressionListApiModelSchema,
  individuAvecValeursApiModelSchema,
  listDernieresValeursQuerySchema,
  listDerniersTauxProgressionQuerySchema,
  listIndividusWithValeursQuerySchema,
  listSyntheseIndividusQuerySchema,
  listValeursForIndicateurQuerySchema,
  listValeursRemarquablesForIndicateurQuerySchema,
  syntheseIndividusListApiModelSchema,
  upsertValeurAvancementBodySchema,
  upsertValeursAvancementBatchBodySchema,
  upsertValeursAvancementBatchResultApiModelSchema,
  valeurAvancementListApiModelSchema,
  valeurSaisieApiModelSchema,
  valeursRemarquablesListApiModelSchema,
} from '@pilote/kpilote-shared/valeurAvancement'
import {
  listTauxProgressionQuerySchema,
  tauxProgressionListApiModelSchema,
} from '@pilote/kpilote-shared/tauxProgression'
import {
  listCollectionTauxProgressionQuerySchema,
  collectionTauxProgressionSummaryListApiModelSchema,
} from '@pilote/kpilote-shared/collectionTauxProgression'

import { modalitesErrorMessage } from '@/axe/requestedModalites'
import { type ResolveSelectionError, selectionErrorMessage } from '@/axe/resolveSelection'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur403 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import {
  type DeleteValeurAvancementError,
  deleteValeurAvancement,
} from '@/valeurAvancement/commands/deleteValeurAvancement'
import {
  type UpsertValeurAvancementError,
  upsertValeurAvancement,
} from '@/valeurAvancement/commands/upsertValeurAvancement'
import {
  upsertValeursAvancementBatch,
  type UpsertValeursAvancementBatchError,
} from '@/valeurAvancement/commands/upsertValeursAvancementBatch'
import { listCollectionTauxProgression } from '@/collection/queries/listCollectionTauxProgression'
import { listDernieresValeurs } from '@/valeurAvancement/queries/listDernieresValeurs'
import { listDerniersTauxProgression } from '@/valeurAvancement/queries/listDerniersTauxProgression'
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
const ValidationErrorApiModelSchema =
  validationErrorApiModelSchema.openapi('ValidationErrorApiModel')
const IndividusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
).openapi('IndividusWithValeursListApiModel')
const ValeursRemarquablesListApiModelSchema = valeursRemarquablesListApiModelSchema.openapi(
  'ValeursRemarquablesListApiModel',
)
const SyntheseIndividusListApiModelSchema = syntheseIndividusListApiModelSchema.openapi(
  'SyntheseIndividusListApiModel',
)
const TauxProgressionListApiModelSchema = tauxProgressionListApiModelSchema.openapi(
  'TauxProgressionListApiModel',
)
const DernieresValeursListApiModelSchema = dernieresValeursListApiModelSchema.openapi(
  'DernieresValeursListApiModel',
)
const DerniersTauxProgressionListApiModelSchema = derniersTauxProgressionListApiModelSchema.openapi(
  'DerniersTauxProgressionListApiModel',
)
const CollectionTauxProgressionSummaryListApiModelSchema =
  collectionTauxProgressionSummaryListApiModelSchema.openapi(
    'CollectionTauxProgressionSummaryListApiModel',
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
    'Au-delà la requête est acceptée mais peut être lente. ' +
    'Indicateur à axes : sans `modalites`, chaque point vaut « Tous » sur chaque axe (axes ' +
    'combinés dans chaque territoire le plus fin, puis remontée territoriale) ; `modalites` ' +
    '(publicIds séparés par une virgule, au plus un par axe, modalité parente acceptée) précise ' +
    'la lecture, un axe non cité valant « Tous ». Les contributions calculées à partir de ' +
    'modalités portent un champ `modalites`. Erreurs 400 : `MODALITE_INCONNUE`, ' +
    '`AXE_NON_DECLARE` (dont un indicateur sans axe), `MODALITES_MEME_AXE`.',
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

const MODALITES_WRITE_DESCRIPTION =
  'Indicateur à axes : `modalites` porte exactement une modalité feuille par axe déclaré ' +
  '(sinon 400 `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, `MODALITES_MEME_AXE`, `MODALITE_MANQUANTE` ' +
  'ou `MODALITE_NON_FEUILLE`). Indicateur sans axe : `modalites` absent ou vide.'

const upsertValeurAvancementRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Saisir ou mettre à jour une valeur ponctuelle pour un individu',
  description:
    "Upsert d'une valeur unique sur la cellule `(indicateur, individu, modalites, date)`. Si la cellule a déjà une valeur à cette date, la `valeur` est remplacée ; sinon une nouvelle valeur est créée. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`). " +
    MODALITES_WRITE_DESCRIPTION,
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
    "Supprime la valeur identifiée par `(indicateur, individu, modalites, date)`. Idempotent : retourne `204` même si la valeur n'existait pas. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`). " +
    MODALITES_WRITE_DESCRIPTION,
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
    "Upsert atomique d'un lot de valeurs (1..1000) sur la cellule `(indicateur, individu, modalites, date)`. " +
    'Tout-ou-rien : si une seule entrée est invalide (individu inconnu/non lié, modalités invalides, ' +
    'doublon `(individu, modalites, date)` dans le payload), aucune valeur n’est appliquée et la réponse ' +
    '400 `BATCH_INVALID` liste exhaustivement les erreurs détectées (agrégées par cause avec leurs ' +
    '`indices` dans `items`). Les modalités de chaque entrée suivent les règles de `PUT /indicateurs/{id}/valeurs`.',
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
          schema: z.union([BatchInvalidErrorApiModelSchema, ValidationErrorApiModelSchema]),
        },
      },
      description:
        "Lot invalide. Aucune valeur n'a été appliquée. " +
        '`BATCH_INVALID` (lot rejeté par la validation métier) — `details.errors` détaille les causes ' +
        '(`INVALID_ITEM`, `INDIVIDU_INCONNU`, `DUPLICATE_KEY`, `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, ' +
        '`MODALITES_MEME_AXE`, `MODALITE_MANQUANTE`, `MODALITE_NON_FEUILLE`) avec leurs `indices` dans `items`. ' +
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
    "Si un référentiel n'a aucun individu avec valeur pour l'indicateur, les trois champs sont à `null` mais l'item est présent." +
    'Indicateur à axes : sans `modalites`, les valeurs sont « Tous » sur chaque axe ; avec `modalites` (publicIds séparés par une virgule, au plus un par axe), la comparaison porte sur ces modalités, et un individu où elles n’ont jamais été observées n’a pas de valeur. ' +
    'Erreurs 400 : `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, `MODALITES_MEME_AXE`.',
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
    'La variation est calculée sur la base de la date de la valeur (pas de la date de saisie) : ' +
    "null si l'individu a moins de deux valeurs (aucune valeur précédente à comparer), sinon différence avec la valeur précédente. " +
    "L'écart à la médiane est calculé par rapport à la médiane des valeurs récentes des individus du même référentiel " +
    "ayant au moins une valeur pour l'indicateur ; null si l'individu n'a aucune valeur." +
    'Indicateur à axes : sans `modalites`, les valeurs sont « Tous » sur chaque axe ; avec `modalites` (publicIds séparés par une virgule, au plus un par axe), la comparaison porte sur ces modalités, et un individu où elles n’ont jamais été observées n’a pas de valeur. ' +
    'Erreurs 400 : `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, `MODALITES_MEME_AXE`.',
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

// --- GET /dernieres-valeurs --------------------------------------------------

const getDernieresValeursRoute = createRoute({
  method: 'get',
  path: '/dernieres-valeurs',
  tags: ['Indicateur'],
  summary: "Lister la dernière valeur connue d'un lot d'indicateurs",
  description:
    'Retourne, pour chaque indicateur demandé accessible en lecture, la dernière valeur connue ' +
    '(saisie ou dérivée par agrégation hiérarchique) sur son individu lu. Avec `individus`, ' +
    "l'individu lu est le premier individu sélectionné dont le référentiel est lié à " +
    "l'indicateur ; un indicateur qu'aucun individu sélectionné ne concerne est omis. Sans " +
    "`individus`, l'individu lu est l'individu racine de l'indicateur. Chaque item précise " +
    "l'individu lu. Un individu sélectionné inconnu renvoie une 404. Les indicateurs sans " +
    'valeur connue ou non accessibles sont omis. Granularité de troncature `month`. Endpoint ' +
    "pensé pour des appels batch côté client (afficher l'avancement sur une liste de cartes).",
  middleware: [requireAuthentication],
  request: {
    query: listDernieresValeursQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DernieresValeursListApiModelSchema } },
      description: 'Dernières valeurs pour les indicateurs demandés',
    },
    400: erreur400,
  },
})

// --- GET /taux-progression/indicateurs ---------------------------------------

const getDerniersTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/taux-progression/indicateurs',
  tags: ['Indicateur'],
  summary: "Lister le taux de progression d'un lot d'indicateurs",
  description:
    'Retourne, pour chaque indicateur demandé accessible en lecture, le taux de progression ' +
    'calculé sur la dernière valeur connue de son individu lu (`min(100, valeur / valeurCible × 100)`, ' +
    "tronqué à 2 décimales). L'individu lu se choisit comme pour `GET /dernieres-valeurs` et " +
    'chaque item le précise. Un individu sélectionné inconnu renvoie une 404. Les indicateurs ' +
    'sans individu lu, sans objectif défini ou sans valeur connue sont omis. Les indicateurs ' +
    'dont la valeurCible est zéro, ou à la baisse (`sensSouhaite = BAISSE`), sont inclus avec ' +
    '`tauxProgression: null`. Endpoint pensé pour des appels batch côté client en parallèle de ' +
    '`dernieres-valeurs`.',
  middleware: [requireAuthentication],
  request: {
    query: listDerniersTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DerniersTauxProgressionListApiModelSchema } },
      description: 'Taux de progression pour les indicateurs demandés',
    },
    400: erreur400,
  },
})

// --- GET /taux-progression/collections ---------------------------------------

const getCollectionsTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/taux-progression/collections',
  tags: ['Collection'],
  summary: "Lister le taux de progression d'un lot de collections",
  description:
    'Retourne, pour chaque collection demandée accessible en lecture, la moyenne pondérée du ' +
    'dernier taux de progression connu de chaque indicateur de la collection, chacun lu sur son ' +
    'individu lu (choisi comme pour `GET /dernieres-valeurs`). Un individu sélectionné inconnu ' +
    'renvoie une 404. Règle tout-ou-rien : `tauxProgression` est null si au moins un indicateur ' +
    "pondéré de la collection n'est pas calculable, y compris un indicateur à la baisse ou sans " +
    'individu lu. Les collections inaccessibles ou inexistantes sont omises. Endpoint pensé pour ' +
    'des appels batch côté client (liste de cartes de collections).',
  middleware: [requireAuthentication],
  request: {
    query: listCollectionTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: CollectionTauxProgressionSummaryListApiModelSchema },
      },
      description: 'Taux de progression pour les collections demandées',
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
    '100 % avant atteinte stricte de la cible). Pour un indicateur à la baisse (`sensSouhaite = BAISSE`), ' +
    'les points sont renvoyés avec `tauxProgression: null`. La valeur et la valeurCible sont résolues par ' +
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

export const valeurAvancementRoutes = createOpenApiHono()

valeurAvancementRoutes.openapi(getValeursForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  return listValeursForIndicateur({
    indicateurPublicId: id,
    query: context.req.valid('query'),
  }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeurAvancementListApiModelSchema,
        status: 200,
      }),
    (error) => {
      const { status, message, details } = describeSelectionError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

valeurAvancementRoutes.openapi(upsertValeurAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return withTransaction(() => upsertValeurAvancement({ indicateurPublicId: id, body })).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeurSaisieApiModelSchema,
        status: 200,
      }),
    (error) => {
      const { status, message, details } = describeCelluleWriteError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

// Erreur d'une écriture unitaire : individu inconnu ou modalités invalides.
const describeCelluleWriteError = (
  error: UpsertValeurAvancementError | DeleteValeurAvancementError,
): { status: 400; message: string; details?: Record<string, unknown> } => {
  const { type: _type, ...details } = error
  return {
    status: 400,
    message:
      error.type === 'INDIVIDU_INCONNU'
        ? "L'individu est inconnu ou n'est pas rattaché à un référentiel lié à l'indicateur"
        : modalitesErrorMessage(error),
    details,
  }
}

// Erreur d'une lecture filtrée par modalités (`modalites=`).
const describeSelectionError = (
  error: ResolveSelectionError,
): { status: 400; message: string; details?: Record<string, unknown> } => ({
  status: 400,
  message: selectionErrorMessage(error),
  details: { modalites: error.modalites },
})

// Le détail reprend toutes les lignes refusées : le schéma de réponse est typé.
const describeBatchInvalidError = (
  error: UpsertValeursAvancementBatchError,
): {
  status: 400
  message: string
  details: { errors: UpsertValeursAvancementBatchError['errors'] }
} => {
  switch (error.type) {
    case 'BATCH_INVALID':
      return {
        status: 400,
        message: "Aucune valeur n'a été appliquée.",
        details: { errors: error.errors },
      }
  }
}

valeurAvancementRoutes.openapi(deleteValeurAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return withTransaction(() => deleteValeurAvancement({ indicateurPublicId: id, body })).match(
    () => context.body(null, 204),
    (error) => {
      const { status, message, details } = describeCelluleWriteError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

valeurAvancementRoutes.openapi(upsertValeursAvancementBatchRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return withTransaction(() =>
    upsertValeursAvancementBatch({ indicateurPublicId: id, body }),
  ).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: UpsertValeursAvancementBatchResultApiModelSchema,
        status: 200,
      }),
    (error) => {
      const { status, message, details } = describeBatchInvalidError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: BatchInvalidErrorApiModelSchema,
        status,
      })
    },
  )
})

valeurAvancementRoutes.openapi(getIndividusWithValeursRoute, async (context) => {
  const { id } = context.req.valid('param')
  return listIndividusWithValeurs({
    indicateurPublicId: id,
    query: context.req.valid('query'),
  }).match(
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
  return listValeursRemarquablesForIndicateur({
    indicateurPublicId: id,
    query: context.req.valid('query'),
  }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeursRemarquablesListApiModelSchema,
        status: 200,
      }),
    (error) => {
      const { status, message, details } = describeSelectionError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

valeurAvancementRoutes.openapi(getSyntheseIndividusRoute, async (context) => {
  const { id } = context.req.valid('param')
  return listSyntheseIndividus({
    indicateurPublicId: id,
    query: context.req.valid('query'),
  }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: SyntheseIndividusListApiModelSchema,
        status: 200,
      }),
    (error) => {
      const { status, message, details } = describeSelectionError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

valeurAvancementRoutes.openapi(getDernieresValeursRoute, async (context) =>
  listDernieresValeurs({ query: context.req.valid('query') }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: DernieresValeursListApiModelSchema, status: 200 }),
    never,
  ),
)

valeurAvancementRoutes.openapi(getDerniersTauxProgressionRoute, async (context) =>
  listDerniersTauxProgression({ query: context.req.valid('query') }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DerniersTauxProgressionListApiModelSchema,
        status: 200,
      }),
    never,
  ),
)

valeurAvancementRoutes.openapi(getCollectionsTauxProgressionRoute, async (context) =>
  listCollectionTauxProgression({ query: context.req.valid('query') }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionTauxProgressionSummaryListApiModelSchema,
        status: 200,
      }),
    never,
  ),
)

valeurAvancementRoutes.openapi(getTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  return listTauxProgressionForIndicateur({
    indicateurPublicId: id,
    query: context.req.valid('query'),
  }).match(
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
