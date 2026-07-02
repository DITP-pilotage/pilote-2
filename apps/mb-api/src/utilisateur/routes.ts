import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  createUtilisateurBodySchema,
  updateUtilisateurBodySchema,
  utilisateurApiModelSchema,
} from '@pilote/mb-shared/utilisateur'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur403, erreur404, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { createUtilisateur } from '@/utilisateur/commands/createUtilisateur'
import { updateUtilisateur } from '@/utilisateur/commands/updateUtilisateur'
import { listUtilisateurs } from '@/utilisateur/queries/listUtilisateurs'

const UtilisateurApiModelSchema = utilisateurApiModelSchema.openapi('UtilisateurApiModel')
const UtilisateurListApiModelSchema = z
  .array(UtilisateurApiModelSchema)
  .openapi('UtilisateurListApiModel')
const CreateUtilisateurBodySchema = createUtilisateurBodySchema.openapi('CreateUtilisateurBody')
const UpdateUtilisateurBodySchema = updateUtilisateurBodySchema.openapi('UpdateUtilisateurBody')

const updateParamsSchema = z.object({
  id: z.string().openapi({ description: "Identifiant (UUID) de l'utilisateur à modifier." }),
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
    'Réservé aux clés API de rôle `ADMIN`. Retourne les utilisateurs triés par date de création décroissante, avec leur statut (`en_attente` / `actif`) et la liste des providers OIDC rattachés.',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: UtilisateurListApiModelSchema } },
      description: 'Liste des utilisateurs',
    },
    403: erreur403,
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
    params: updateParamsSchema,
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

utilisateurRoutes.openapi(listUtilisateursRoute, async (context) =>
  listUtilisateurs().match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurListApiModelSchema, status: 200 }),
    never,
  ),
)

utilisateurRoutes.openapi(updateUtilisateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (await withTransaction(async () => updateUtilisateur(id, body))).match(
    (data) => jsonResponseOk({ context, data, schema: UtilisateurApiModelSchema, status: 200 }),
    never,
  )
})
