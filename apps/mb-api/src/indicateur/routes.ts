import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerIndicateurIndividuCommentaireBodySchema,
  listerIndicateurIndividuCommentairesQuerySchema,
  recupererIndicateurIndividuBrouillonQuerySchema,
} from '@pilote/mb-shared/commentaire'
import {
  indicateurApiModelSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/mb-shared/indicateur'
import { listerNiveauxConfianceQuerySchema } from '@pilote/mb-shared/niveauConfiance'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/mb-shared/publicIds'

import {
  BrouillonApiModelSchema,
  CommentaireApiModelSchema,
  CommentaireListApiModelSchema,
  reponseBrouillon,
  reponseCommentaire,
  reponseListe,
} from '@/commentaire/openapi'
import { getDernierBrouillon } from '@/commentaire/queries/getDernierBrouillon'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { createIndicateur, updateIndicateur } from '@/indicateur/commands/writeIndicateur'
import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'
import {
  NiveauConfianceListApiModelSchema,
  reponseListeNiveauxConfiance,
} from '@/niveauConfiance/openapi'
import { listerNiveauxParCommentaires } from '@/niveauConfiance/queries/listerNiveauxParCommentaires'

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

// --- POST /indicateurs -------------------------------------------------------

const createIndicateurRoute = createRoute({
  method: 'post',
  path: '/indicateurs',
  tags: ['Indicateur', 'Admin'],
  summary: 'Créer un indicateur (identifiant public généré par le serveur)',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Crée un indicateur ; l'identifiant public (`IND-<n>`) est généré côté serveur (dernier numéro + 1). Le champ `referentiels` applique la sémantique replace-all. Si un `referentielId` n'existe pas, 400 `VALIDATION_ERROR` + `details.unknownReferentielIds`. L'opération est atomique.",
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: UpsertIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur créé',
    },
    400: erreur400,
    403: erreur403,
  },
})

// --- PUT /indicateurs/:id ----------------------------------------------------

const upsertIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}',
  tags: ['Indicateur', 'Admin'],
  summary: 'Mettre à jour un indicateur (nom + référentiels liés)',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Met à jour le `nom`, la visibilité, l'unité, les métadonnées et les référentiels liés (replace-all). Renvoie 404 (`ENTITY_NOT_FOUND`) si l'indicateur n'existe pas. L'opération est atomique.",
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
      description: 'Indicateur mis à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
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

indicateurRoutes.openapi(createIndicateurRoute, async (context) => {
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    const publicId = (await createIndicateur(body))._unsafeUnwrap()
    return getIndicateurByPublicId(publicId)
  })

  return result.match(
    (data) => jsonResponseOk({ context, data, schema: IndicateurApiModelSchema, status: 200 }),
    never,
  )
})

indicateurRoutes.openapi(upsertIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    ;(await updateIndicateur(id, body))._unsafeUnwrap()
    return getIndicateurByPublicId(id)
  })

  return result.match(
    (data) => jsonResponseOk({ context, data, schema: IndicateurApiModelSchema, status: 200 }),
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

// --- GET /indicateurs/:id/individus/:individuId/commentaires/brouillon -------

const getIndicateurIndividuBrouillonRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires/brouillon',
  tags: ['Indicateur'],
  summary: 'Récupérer mon brouillon courant (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: recupererIndicateurIndividuBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

indicateurRoutes.openapi(getIndicateurIndividuBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(indicateurIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /indicateurs/:id/individus/:individuId/niveaux-confiance ------------

const listerNiveauxParCommentairesIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveaux-confiance',
  tags: ['Indicateur', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

indicateurRoutes.openapi(listerNiveauxParCommentairesIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(indicateurIndividuConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
