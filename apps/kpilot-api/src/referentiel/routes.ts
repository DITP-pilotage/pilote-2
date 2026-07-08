import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  individuApiModelSchema,
  listIndividusForReferentielQuerySchema,
} from '@pilote/kpilot-shared/individu'
import { createPaginatedApiListSchema } from '@pilote/kpilot-shared/pagination'
import {
  listReferentielsQuerySchema,
  referentielApiModelSchema,
  referentielPublicIdSchema,
  upsertReferentielBodySchema,
} from '@pilote/kpilot-shared/referentiel'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur403, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertReferentiel } from '@/referentiel/commands/upsertReferentiel'
import { getReferentielByPublicId } from '@/referentiel/queries/getReferentielByPublicId'
import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'

const ReferentielApiModelSchema = referentielApiModelSchema.openapi('ReferentielApiModel')
const ReferentielListApiModelSchema =
  createPaginatedApiListSchema(referentielApiModelSchema).openapi('ReferentielListApiModel')
const IndividuListApiModelSchema =
  createPaginatedApiListSchema(individuApiModelSchema).openapi('IndividuListApiModel')
const UpsertReferentielBodySchema = upsertReferentielBodySchema.openapi('UpsertReferentielBody')

// --- GET /referentiels -------------------------------------------------------

const getReferentielsRoute = createRoute({
  method: 'get',
  path: '/referentiels',
  tags: ['Referentiel'],
  summary: 'Lister les référentiels',
  description:
    'Retourne la liste paginée des référentiels avec un filtre de recherche par nom. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. Chaque item inclut `nombreIndividus` (population du référentiel).',
  middleware: [requireAuthentication],
  request: { query: listReferentielsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ReferentielListApiModelSchema } },
      description: 'Liste paginée des référentiels',
    },
    400: erreur400,
  },
})

// --- GET /referentiels/:id ---------------------------------------------------

const detailParamsSchema = z.object({
  id: referentielPublicIdSchema,
})

const getReferentielByIdRoute = createRoute({
  method: 'get',
  path: '/referentiels/{id}',
  tags: ['Referentiel'],
  summary: 'Récupérer un référentiel par identifiant public',
  description:
    'Retourne un référentiel identifié par son identifiant public (format `REF-<SLUG>`).',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ReferentielApiModelSchema } },
      description: 'Référentiel trouvé',
    },
  },
})

// --- PUT /referentiels/:id ---------------------------------------------------

const upsertReferentielRoute = createRoute({
  method: 'put',
  path: '/referentiels/{id}',
  tags: ['Referentiel', 'Admin'],
  summary: 'Créer ou mettre à jour un référentiel',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Crée le référentiel s'il n'existe pas, ou met à jour son `nom` et sa `description` quand le référentiel existe déjà. Le tableau `individus` est optionnel : chaque individu est créé et rattaché au référentiel, ou son nom est mis à jour s'il existe déjà et qu'il est déjà rattaché à ce même référentiel. Si un individu listé existe et est rattaché à un autre référentiel, la requête est rejetée (409). Opération idempotente, exécutée dans une transaction.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertReferentielBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ReferentielApiModelSchema } },
      description: 'Référentiel créé ou mis à jour',
    },
    400: erreur400,
    403: erreur403,
    409: erreur409,
  },
})

// --- GET /referentiels/:id/individus -----------------------------------------

const getIndividusForReferentielRoute = createRoute({
  method: 'get',
  path: '/referentiels/{id}/individus',
  tags: ['Referentiel'],
  summary: "Lister les individus d'un référentiel",
  description:
    'Retourne la liste paginée des individus appartenant à la population du référentiel donné. Filtre optionnel `recherche` sur le nom. Pagination cursor-based.',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    query: listIndividusForReferentielQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividuListApiModelSchema } },
      description: 'Liste paginée des individus du référentiel',
    },
  },
})

// --- App registration --------------------------------------------------------

export const referentielRoutes = new OpenAPIHono()

referentielRoutes.openapi(getReferentielsRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listReferentiels({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ReferentielListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

referentielRoutes.openapi(getReferentielByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getReferentielByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ReferentielApiModelSchema,
        status: 200,
      }),
    never,
  )
})

referentielRoutes.openapi(upsertReferentielRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return (
    await withTransaction(async () =>
      upsertReferentiel(id, body).andThen(() => getReferentielByPublicId(id)),
    )
  ).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ReferentielApiModelSchema,
        status: 200,
      }),
    (error) =>
      jsonResponseError({
        context,
        error: {
          code: error.type,
          message: `Les individus suivants sont déjà rattachés à un autre référentiel : ${error.individuIds.join(', ')}`,
          details: { individuIds: error.individuIds },
        },
        schema: ErrorApiModelSchema,
        status: 409,
      }),
  )
})

referentielRoutes.openapi(getIndividusForReferentielRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listIndividusForReferentiel(id, { recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
