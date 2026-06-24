import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerIndicateurIndividuCommentaireBodySchema,
  listerIndicateurIndividuCommentairesQuerySchema,
} from '@pilote/mb-shared/commentaire'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  indicateurApiModelSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/mb-shared/indicateur'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/mb-shared/publicIds'

import {
  CommentaireApiModelSchema,
  CommentaireListApiModelSchema,
  reponseCommentaire,
  reponseListe,
} from '@/commentaire/openapi'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { creerIndicateurIndividuCommentaire } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema =
  createPaginatedApiListSchema(indicateurApiModelSchema).openapi('IndicateurListApiModel')
const UpsertIndicateurBodySchema = upsertIndicateurBodySchema.openapi('UpsertIndicateurBody')
export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

// --- GET /indicateurs --------------------------------------------------------

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    "Retourne la liste paginée des indicateurs avec un filtre de recherche par nom. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s'il reste des pages. Chaque item inclut `referentielIds` (triés par identifiant public ASC).",
  middleware: [requireAuthentication],
  request: { query: listIndicateursQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /indicateurs/:id ----------------------------------------------------

const detailParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par identifiant public',
  description:
    'Retourne un indicateur identifié par son identifiant public (format `IND-XXX`). La réponse inclut `referentielIds` (référentiels liés, triés par publicId ASC). Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun indicateur ne correspond.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- PUT /indicateurs/:id ----------------------------------------------------

const upsertIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}',
  tags: ['Indicateur', 'Admin'],
  summary: 'Créer ou remplacer un indicateur (nom + référentiels liés)',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Crée l'indicateur s'il n'existe pas, ou met à jour son `nom` si déjà présent. Le champ `referentielIds` est obligatoire et applique une sémantique replace-all : l'ensemble des liens devient strictement celui décrit dans le body (tableau vide pour aucun lien). Les doublons sont silencieusement dédupliqués. Si un `referentielId` n'existe pas, l'appel échoue avec 400 `VALIDATION_ERROR` et `details.unknownReferentielIds`. L'opération est atomique (transaction unique).",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur créé ou mis à jour',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Requête invalide (body ou référentiels inconnus)',
    },
    403: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Clé API sans le rôle ADMIN requis',
    },
  },
})

// --- App registration --------------------------------------------------------

export const indicateurRoutes = new OpenAPIHono()

indicateurRoutes.openapi(getIndicateursRoute, async (context) => {
  const { recherche, cursor, pageSize, ids } = context.req.valid('query')

  return listIndicateurs({ recherche, cursor, pageSize, ids }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(getIndicateurByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getIndicateurByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(upsertIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    await upsertIndicateur(id, body)
    return getIndicateurByPublicId(id)
  })

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /indicateurs/:id/individus/:individuId/commentaires ----------------

const indicateurIndividuCommentaireParamsSchema = z.object({
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema,
})

const creerIndicateurIndividuCommentaireRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Indicateur'],
  summary: 'Créer un commentaire sur un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerIndicateurIndividuCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})

indicateurRoutes.openapi(creerIndicateurIndividuCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () =>
    creerIndicateurIndividuCommentaire({ params, body }),
  )
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /indicateurs/:id/individus/:individuId/commentaires -----------------

const listerIndicateurIndividuCommentairesRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Indicateur'],
  summary: 'Lister les commentaires d’un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: listerIndicateurIndividuCommentairesQuerySchema,
  },
  responses: reponseListe,
})

indicateurRoutes.openapi(listerIndicateurIndividuCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerIndicateurIndividuCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})
