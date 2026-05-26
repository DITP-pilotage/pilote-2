import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import {
  deleteObjectifAvancementBodySchema,
  listObjectifsForIndicateurQuerySchema,
  objectifAvancementApiModelSchema,
  objectifAvancementListApiModelSchema,
  upsertObjectifAvancementBodySchema,
} from '@pilote/mb-shared/objectifAvancement'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { deleteObjectifAvancement } from '@/objectifAvancement/commands/deleteObjectifAvancement'
import { upsertObjectifAvancement } from '@/objectifAvancement/commands/upsertObjectifAvancement'
import { listObjectifsForIndicateur } from '@/objectifAvancement/queries/listObjectifsForIndicateur'

const ObjectifAvancementApiModelSchema = objectifAvancementApiModelSchema.openapi(
  'ObjectifAvancementApiModel',
)
const ObjectifAvancementListApiModelSchema = objectifAvancementListApiModelSchema.openapi(
  'ObjectifAvancementListApiModel',
)
const UpsertObjectifAvancementBodySchema = upsertObjectifAvancementBodySchema.openapi(
  'UpsertObjectifAvancementBody',
)
const DeleteObjectifAvancementBodySchema = deleteObjectifAvancementBodySchema.openapi(
  'DeleteObjectifAvancementBody',
)
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
    'Triés par `(individu, date ASC)`.',
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listObjectifsForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ObjectifAvancementListApiModelSchema } },
      description: 'Objectifs pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent ou format incorrect)',
    },
  },
})

// --- PUT /indicateurs/:id/objectifs ------------------------------------------

const upsertObjectifAvancementRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/objectifs',
  tags: ['Indicateur'],
  summary: 'Saisir ou mettre à jour un objectif pour un individu',
  description:
    "Upsert d'un objectif sur la clé `(indicateur, individu, date)`. Si le triplet existe, la `valeur` est remplacée ; sinon un nouvel objectif est créé. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertObjectifAvancementBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ObjectifAvancementApiModelSchema } },
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

const deleteObjectifAvancementRoute = createRoute({
  method: 'delete',
  path: '/indicateurs/{id}/objectifs',
  tags: ['Indicateur'],
  summary: 'Supprimer un objectif pour un individu',
  description:
    "Supprime l'objectif identifié par `(indicateur, individu, date)`. Idempotent : retourne `204` même si l'objectif n'existait pas. " +
    "L'individu doit appartenir à un référentiel lié à l'indicateur (sinon 400 `INDIVIDU_INCONNU`).",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: DeleteObjectifAvancementBodySchema } },
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

export const objectifAvancementRoutes = new OpenAPIHono()

objectifAvancementRoutes.openapi(getObjectifsForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus } = context.req.valid('query')

  return listObjectifsForIndicateur(id, { individus }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ObjectifAvancementListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

objectifAvancementRoutes.openapi(upsertObjectifAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    upsertObjectifAvancement({ indicateurPublicId: id, body }),
  )

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ObjectifAvancementApiModelSchema,
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

objectifAvancementRoutes.openapi(deleteObjectifAvancementRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () =>
    deleteObjectifAvancement({ indicateurPublicId: id, body }),
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
