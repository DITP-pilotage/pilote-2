import { createRoute, z } from '@hono/zod-openapi'
import {
  apiKeyApiModelSchema,
  createApiKeyBodySchema,
  createdApiKeyApiModelSchema,
} from '@pilote/kpilote-shared/apiKey'

import { createApiKey } from '@/apiKey/commands/createApiKey'
import { revokeApiKey } from '@/apiKey/commands/revokeApiKey'
import { getApiKeyById } from '@/apiKey/queries/getApiKeyById'
import { listApiKeys } from '@/apiKey/queries/listApiKeys'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur403, erreur404, erreur409, succes200 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

const ApiKeyApiModelSchema = apiKeyApiModelSchema.openapi('ApiKeyApiModel')
const ApiKeyListApiModelSchema = z.array(ApiKeyApiModelSchema).openapi('ApiKeyListApiModel')
const CreatedApiKeyApiModelSchema = createdApiKeyApiModelSchema.openapi('CreatedApiKeyApiModel')
const CreateApiKeyBodySchema = createApiKeyBodySchema.openapi('CreateApiKeyBody')

const revokeParamsSchema = z.object({
  id: z.string().openapi({ description: 'Identifiant (UUID) de la clé API à révoquer.' }),
})

const detailParamsSchema = z.object({
  id: z.string().uuid().openapi({ description: 'Identifiant (UUID) de la clé API.' }),
})

// --- POST /api-keys ----------------------------------------------------------

const createApiKeyRoute = createRoute({
  method: 'post',
  path: '/api-keys',
  tags: ['ApiKey', 'Admin'],
  summary: 'Créer une clé API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Génère une nouvelle clé et retourne sa valeur en clair (`rawKey`) **une seule fois** : elle n'est pas re-affichable ensuite.",
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: CreateApiKeyBodySchema } }, required: true },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CreatedApiKeyApiModelSchema } },
      description: 'Clé API créée',
    },
    403: erreur403,
  },
})

// --- GET /api-keys -----------------------------------------------------------

const listApiKeysRoute = createRoute({
  method: 'get',
  path: '/api-keys',
  tags: ['ApiKey', 'Admin'],
  summary: 'Lister les clés API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Retourne les clés triées par date de création décroissante. Aucune valeur secrète n'est exposée (ni hash, ni clé en clair).",
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: ApiKeyListApiModelSchema } },
      description: 'Liste des clés API',
    },
    403: erreur403,
  },
})

// --- GET /api-keys/{id} ------------------------------------------------------

const getApiKeyByIdRoute = createRoute({
  method: 'get',
  path: '/api-keys/{id}',
  tags: ['ApiKey', 'Admin'],
  summary: 'Récupérer une clé API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Retourne les métadonnées d'une clé (aucune valeur secrète).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: succes200('Clé API trouvée', ApiKeyApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /api-keys/{id}/revoke ----------------------------------------------

const revokeApiKeyRoute = createRoute({
  method: 'post',
  path: '/api-keys/{id}/revoke',
  tags: ['ApiKey', 'Admin'],
  summary: 'Révoquer une clé API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Révoque la clé (soft-delete). Renvoie 409 si la clé est déjà révoquée ou si l'on tente de révoquer la clé utilisée pour la requête, 404 si la clé est introuvable.",
  middleware: [requireAuthentication],
  request: { params: revokeParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ApiKeyApiModelSchema } },
      description: 'Clé API révoquée',
    },
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

export const apiKeyRoutes = createOpenApiHono()

apiKeyRoutes.openapi(createApiKeyRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => createApiKey(body))).match(
    (data) => jsonResponseOk({ context, data, schema: CreatedApiKeyApiModelSchema, status: 201 }),
    never,
  )
})

apiKeyRoutes.openapi(listApiKeysRoute, async (context) =>
  listApiKeys().match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyListApiModelSchema, status: 200 }),
    never,
  ),
)

apiKeyRoutes.openapi(getApiKeyByIdRoute, async (context) => {
  const { id } = context.req.valid('param')
  return getApiKeyById(id).match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyApiModelSchema, status: 200 }),
    never,
  )
})

apiKeyRoutes.openapi(revokeApiKeyRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await withTransaction(async () => revokeApiKey(id))).match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyApiModelSchema, status: 200 }),
    never,
  )
})
