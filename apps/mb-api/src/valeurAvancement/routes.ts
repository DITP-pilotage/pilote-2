import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import {
  individuAvecValeursApiModelSchema,
  listIndividusWithValeursQuerySchema,
  listSyntheseIndividusQuerySchema,
  listValeursForIndicateurQuerySchema,
  listValeursRemarquablesForIndicateurQuerySchema,
  syntheseIndividusListApiModelSchema,
  upsertValeurAvancementBodySchema,
  valeurAvancementApiModelSchema,
  valeurAvancementListApiModelSchema,
  valeursRemarquablesListApiModelSchema,
} from '@pilote/mb-shared/valeurAvancement'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { ForbiddenError } from '@/framework/errors/AppError'
import { never } from '@/framework/errors/never'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'
import { listSyntheseIndividus } from '@/valeurAvancement/queries/listSyntheseIndividus'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

const ValeurAvancementApiModelSchema = valeurAvancementApiModelSchema.openapi(
  'ValeurAvancementApiModel',
)
const ValeurAvancementListApiModelSchema = valeurAvancementListApiModelSchema.openapi(
  'ValeurAvancementListApiModel',
)
const UpsertValeurAvancementBodySchema = upsertValeurAvancementBodySchema.openapi(
  'UpsertValeurAvancementBody',
)
const IndividusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
).openapi('IndividusWithValeursListApiModel')
const ValeursRemarquablesListApiModelSchema = valeursRemarquablesListApiModelSchema.openapi(
  'ValeursRemarquablesListApiModel',
)
const SyntheseIndividusListApiModelSchema = syntheseIndividusListApiModelSchema.openapi(
  'SyntheseIndividusListApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/valeurs --------------------------------------------

const getValeursForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs pour un indicateur sur des individus',
  description:
    "Retourne les valeurs saisies pour l'indicateur sur la liste d'individus fournie. Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `DEPT-84,DEPT-13`). Filtres optionnels `dateDebut`/`dateFin` (ISO `YYYY-MM-DD`, inclusifs). La réponse n'est pas paginée — le volume est borné par la liste d'individus.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listValeursForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeurAvancementListApiModelSchema } },
      description: 'Valeurs pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent ou date invalide)',
    },
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
      content: { 'application/json': { schema: ValeurAvancementApiModelSchema } },
      description: 'Valeur créée ou mise à jour',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Requête invalide (body invalide ou individu inconnu/non autorisé)',
    },
    403: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Pas de permission WRITE sur cet indicateur',
    },
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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `referentiels` absent)',
    },
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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent)',
    },
  },
})

// --- App registration --------------------------------------------------------

export const valeurAvancementRoutes = new OpenAPIHono()

valeurAvancementRoutes.openapi(getValeursForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus, dateDebut, dateFin } = context.req.valid('query')

  return listValeursForIndicateur(id, { individus, dateDebut, dateFin }).match(
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
        schema: ValeurAvancementApiModelSchema,
        status: 200,
      }),
    (error) => {
      if (error instanceof ForbiddenError) {
        return jsonResponseError({
          context,
          error: { code: error.code, message: error.message },
          schema: ErrorApiModelSchema,
          status: 403,
        })
      }
      return jsonResponseError({
        context,
        error: {
          code: error.type,
          message:
            "L'individu est inconnu ou n'est pas rattaché à un référentiel lié à l'indicateur",
          details: { individu: error.individu },
        },
        schema: ErrorApiModelSchema,
        status: 400,
      })
    },
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
  const { referentiels } = context.req.valid('query')

  return listValeursRemarquablesForIndicateur(id, { referentiels }).match(
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
  const { individus } = context.req.valid('query')

  return listSyntheseIndividus(id, { individus }).match(
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
