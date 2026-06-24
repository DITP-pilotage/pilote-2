import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerIndicateurIndividuCommentaireBodySchema,
  listerIndicateurIndividuCommentairesQuerySchema,
} from '@pilote/mb-shared/commentaire'
import {
  indicateurApiModelSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/mb-shared/indicateur'
import { historiqueNiveauConfianceQuerySchema } from '@pilote/mb-shared/niveauConfiance'
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
import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'
import {
  NiveauConfianceApiModelSchema,
  NiveauConfianceListApiModelSchema,
  reponseHistoriqueNiveauConfiance,
  reponseNiveauConfiance,
} from '@/niveauConfiance/openapi'
import { getNiveauConfianceCourant } from '@/niveauConfiance/queries/getNiveauConfianceCourant'
import { listerHistoriqueNiveauConfiance } from '@/niveauConfiance/queries/listerHistoriqueNiveauConfiance'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema =
  createPaginatedApiListSchema(indicateurApiModelSchema).openapi('IndicateurListApiModel')
const UpsertIndicateurBodySchema = upsertIndicateurBodySchema.openapi('UpsertIndicateurBody')

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
    400: erreur400,
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
    404: erreur404,
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
    400: erreur400,
    403: erreur403,
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

// --- GET /indicateurs/:id/individus/:individuId/niveau-confiance -------------

const getNiveauConfianceIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance',
  tags: ['Indicateur', 'NiveauConfiance'],
  summary: 'Récupérer le niveau de confiance courant (indicateur + individu)',
  middleware: [requireAuthentication],
  request: { params: indicateurIndividuCommentaireParamsSchema },
  responses: reponseNiveauConfiance,
})

indicateurRoutes.openapi(getNiveauConfianceIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  return getNiveauConfianceCourant(indicateurIndividuConfig, { params }).match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /indicateurs/:id/individus/:individuId/niveau-confiance/historique --

const listerHistoriqueNiveauConfianceIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance/historique',
  tags: ['Indicateur', 'NiveauConfiance'],
  summary: 'Historique des niveaux de confiance (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: historiqueNiveauConfianceQuerySchema,
  },
  responses: reponseHistoriqueNiveauConfiance,
})

indicateurRoutes.openapi(
  listerHistoriqueNiveauConfianceIndicateurIndividuRoute,
  async (context) => {
    const params = context.req.valid('param')
    const query = context.req.valid('query')
    return listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query }).match(
      (data) =>
        jsonResponseOk({
          context,
          data,
          schema: NiveauConfianceListApiModelSchema,
          status: 200,
        }),
      never,
    )
  },
)
