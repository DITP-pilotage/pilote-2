import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  individuApiModelSchema,
  listIndividusForReferentielQuerySchema,
} from '@pilote/mb-shared/individu'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import {
  listReferentielsQuerySchema,
  referentielApiModelSchema,
  referentielPublicIdSchema,
  upsertReferentielBodySchema,
} from '@pilote/mb-shared/referentiel'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
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
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
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
  tags: ['Referentiel'],
  summary: 'Créer ou mettre à jour un référentiel',
  description:
    "Crée le référentiel s'il n'existe pas, ou met à jour son `nom` et sa `description` quand le référentiel existe déjà. Le tableau `individus` est optionnel et appliqué en mode merge : chaque individu est upsert (création/mise à jour du nom) et lié au référentiel ; les individus déjà liés et absents du body ne sont pas retirés. Opération idempotente, exécutée dans une transaction.",
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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Corps de requête ou paramètres invalides',
    },
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

  const result = await withTransaction(async () => upsertReferentiel(id, body))

  return result.match(
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
