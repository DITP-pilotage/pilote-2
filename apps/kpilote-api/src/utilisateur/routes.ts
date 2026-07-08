import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import {
  createUtilisateurBodySchema,
  listUtilisateursQuerySchema,
  updateUtilisateurBodySchema,
  utilisateurApiModelSchema,
} from '@pilote/kpilote-shared/utilisateur'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { createUtilisateur } from '@/utilisateur/commands/createUtilisateur'
import { updateUtilisateur } from '@/utilisateur/commands/updateUtilisateur'
import { getUtilisateurById } from '@/utilisateur/queries/getUtilisateurById'
import { listUtilisateurs } from '@/utilisateur/queries/listUtilisateurs'

const UtilisateurApiModelSchema = utilisateurApiModelSchema.openapi('UtilisateurApiModel')
const UtilisateurListApiModelSchema =
  createPaginatedApiListSchema(utilisateurApiModelSchema).openapi('UtilisateurListApiModel')
const CreateUtilisateurBodySchema = createUtilisateurBodySchema.openapi('CreateUtilisateurBody')
const UpdateUtilisateurBodySchema = updateUtilisateurBodySchema.openapi('UpdateUtilisateurBody')

const detailParamsSchema = z.object({
  id: z.string().uuid().openapi({ description: "Identifiant (UUID) de l'utilisateur." }),
})

// --- POST /utilisateurs ------------------------------------------------------

const createUtilisateurRoute = createRoute({
  method: 'post',
  path: '/utilisateurs',
  tags: ['Utilisateur', 'Admin'],
  summary: 'Créer un utilisateur pré-provisionné',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Crée un utilisateur en statut `en_attente`. L'identité OIDC (ProConnect / Keycloak) est rattachée automatiquement au 1ᵉʳ login via l'email.",
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: CreateUtilisateurBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UtilisateurApiModelSchema } },
      description: 'Utilisateur créé',
    },
    403: erreur403,
    409: erreur409,
  },
})

// --- GET /utilisateurs -------------------------------------------------------

const listUtilisateursRoute = createRoute({
  method: 'get',
  path: '/utilisateurs',
  tags: ['Utilisateur', 'Admin'],
  summary: 'Lister les utilisateurs',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Retourne la liste paginée des utilisateurs (tri par identifiant croissant), avec leur statut (`en_attente` / `actif`) et la liste des providers OIDC rattachés. Filtre optionnel `recherche` (email, nom, prénom). Pagination cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante.',
  middleware: [requireAuthentication],
  request: { query: listUtilisateursQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: UtilisateurListApiModelSchema } },
      description: 'Liste paginée des utilisateurs',
    },
    400: erreur400,
    403: erreur403,
  },
})

// --- GET /utilisateurs/{id} --------------------------------------------------

const getUtilisateurByIdRoute = createRoute({
  method: 'get',
  path: '/utilisateurs/{id}',
  tags: ['Utilisateur', 'Admin'],
  summary: 'Récupérer un utilisateur',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Retourne un utilisateur identifié par son identifiant (UUID).',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: UtilisateurApiModelSchema } },
      description: 'Utilisateur trouvé',
    },
    403: erreur403,
    404: erreur404,
  },
})

// --- PATCH /utilisateurs/{id} ------------------------------------------------

const updateUtilisateurRoute = createRoute({
  method: 'patch',
  path: '/utilisateurs/{id}',
  tags: ['Utilisateur', 'Admin'],
  summary: 'Mettre à jour un utilisateur',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Met à jour `nom`, `prenom`, `service`, `fonction`. **`email` est immuable** (clé du linking OIDC).',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpdateUtilisateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UtilisateurApiModelSchema } },
      description: 'Utilisateur mis à jour',
    },
    403: erreur403,
    404: erreur404,
  },
})

export const utilisateurRoutes = new OpenAPIHono()

utilisateurRoutes.openapi(createUtilisateurRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => createUtilisateur(body))).match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurApiModelSchema, status: 201 }),
    never,
  )
})

utilisateurRoutes.openapi(listUtilisateursRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')
  return listUtilisateurs({ recherche, cursor, pageSize }).match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurListApiModelSchema, status: 200 }),
    never,
  )
})

utilisateurRoutes.openapi(getUtilisateurByIdRoute, async (context) => {
  const { id } = context.req.valid('param')
  return getUtilisateurById(id).match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurApiModelSchema, status: 200 }),
    never,
  )
})

utilisateurRoutes.openapi(updateUtilisateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (await withTransaction(async () => updateUtilisateur(id, body))).match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurApiModelSchema, status: 200 }),
    never,
  )
})
