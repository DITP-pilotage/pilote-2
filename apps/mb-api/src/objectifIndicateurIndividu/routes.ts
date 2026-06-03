import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema } from '@pilote/mb-shared/publicIds'
import {
  deleteObjectifIndicateurIndividuBodySchema,
  listObjectifsForIndicateurQuerySchema,
  objectifIndicateurIndividuApiModelSchema,
  objectifIndicateurIndividuListApiModelSchema,
  upsertObjectifIndicateurIndividuBodySchema,
} from '@pilote/mb-shared/objectifIndicateurIndividu'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { deleteObjectifIndicateurIndividu } from '@/objectifIndicateurIndividu/commands/deleteObjectifIndicateurIndividu'
import { upsertObjectifIndicateurIndividu } from '@/objectifIndicateurIndividu/commands/upsertObjectifIndicateurIndividu'
import { listObjectifsForIndicateur } from '@/objectifIndicateurIndividu/queries/listObjectifsForIndicateur'

const ObjectifIndicateurIndividuApiModelSchema = objectifIndicateurIndividuApiModelSchema.openapi(
  'ObjectifIndicateurIndividuApiModel',
)
const ObjectifIndicateurIndividuListApiModelSchema =
  objectifIndicateurIndividuListApiModelSchema.openapi('ObjectifIndicateurIndividuListApiModel')
const UpsertObjectifIndicateurIndividuBodySchema =
  upsertObjectifIndicateurIndividuBodySchema.openapi('UpsertObjectifIndicateurIndividuBody')
const DeleteObjectifIndicateurIndividuBodySchema =
  deleteObjectifIndicateurIndividuBodySchema.openapi('DeleteObjectifIndicateurIndividuBody')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/objectifs ------------------------------------------

const getObjectifsForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/objectifs',
  tags: ['Indicateur'],
  summary: 'Lister les objectifs saisis pour un indicateur sur des individus',
  description:
    "Retourne la liste des objectifs saisis manuellement pour l'indicateur sur les individus demandés. " +
    'Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `DEPT-84,DEPT-13`). ' +
    'Les individus sans objectif sont absents de la réponse. ' +
    "Les individus inconnus ou non rattachés à un référentiel lié à l'indicateur sont silencieusement ignorés. " +
    'Triés par `(individu, dateCible ASC)`.',
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listObjectifsForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ObjectifIndicateurIndividuListApiModelSchema } },
      description: 'Objectifs pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent ou format incorrect)',
    },
  },
})

// --- PUT /indicateurs/:id/objectifs ------------------------------------------

const upsertObjectifIndicateurIndividuRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/objectifs',
  tags: ['Indicateur'],
  summary: 'Saisir ou mettre à jour un objectif pour un individu',
  description:
    "Upsert d'un objectif sur la clé `(indicateur, individu, dateCible)`. Si le triplet existe, la `valeurCible` est remplacée ; sinon un nouvel objectif est créé. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertObjectifIndicateurIndividuBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ObjectifIndicateurIndividuApiModelSchema } },
      description: 'Objectif créé ou mis à jour',
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

// --- DELETE /indicateurs/:id/objectifs ---------------------------------------

const deleteObjectifIndicateurIndividuRoute = createRoute({
  method: 'delete',
  path: '/indicateurs/{id}/objectifs',
  tags: ['Indicateur'],
  summary: 'Supprimer un objectif pour un individu',
  description:
    "Supprime l'objectif identifié par `(indicateur, individu, dateCible)`. Idempotent : retourne `204` même si l'objectif n'existait pas. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: DeleteObjectifIndicateurIndividuBodySchema } },
      required: true,
    },
  },
  responses: {
    204: {
      description: 'Objectif supprimé (ou inexistant — idempotent)',
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

// --- App registration --------------------------------------------------------

export const objectifIndicateurIndividuRoutes = new OpenAPIHono()

objectifIndicateurIndividuRoutes.openapi(getObjectifsForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus, dateTrunc } = context.req.valid('query')

  return listObjectifsForIndicateur(id, { individus, dateTrunc }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ObjectifIndicateurIndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

objectifIndicateurIndividuRoutes.openapi(upsertObjectifIndicateurIndividuRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    upsertObjectifIndicateurIndividu({ indicateurPublicId: id, body }),
  )

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ObjectifIndicateurIndividuApiModelSchema,
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

objectifIndicateurIndividuRoutes.openapi(deleteObjectifIndicateurIndividuRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    deleteObjectifIndicateurIndividu({ indicateurPublicId: id, body }),
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
