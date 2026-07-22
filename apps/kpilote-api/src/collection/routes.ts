import { createRoute, z } from '@hono/zod-openapi'
import {
  creerCollectionCommentaireBodySchema,
  listerCollectionCommentairesQuerySchema,
  recupererCollectionBrouillonQuerySchema,
} from '@pilote/kpilote-shared/commentaire'
import { listerNiveauxConfianceQuerySchema } from '@pilote/kpilote-shared/niveauConfiance'
import {
  collectionApiModelSchema,
  collectionListApiModelSchema,
  listCollectionsQuerySchema,
} from '@pilote/kpilote-shared/collection'
import {
  collectionTauxProgressionApiModelSchema,
  getCollectionTauxProgressionQuerySchema,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { collectionPublicIdSchema } from '@pilote/kpilote-shared/publicIds'

import {
  NiveauConfianceListApiModelSchema,
  reponseListeNiveauxConfiance,
} from '@/niveauConfiance/openapi'
import { listerNiveauxParCommentaires } from '@/niveauConfiance/queries/listerNiveauxParCommentaires'
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
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import {
  creerCollectionCommentaire,
  collectionConfig,
} from '@/collection/commands/creerCollectionCommentaire'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import { listCollections } from '@/collection/queries/listCollections'
import { listerCollectionCommentaires } from '@/collection/queries/listerCollectionCommentaires'

const CollectionApiModelSchema = collectionApiModelSchema.openapi('CollectionApiModel')
const CollectionListApiModelSchema = collectionListApiModelSchema.openapi('CollectionListApiModel')
const CollectionTauxProgressionApiModelSchema = collectionTauxProgressionApiModelSchema.openapi(
  'CollectionTauxProgressionApiModel',
)

// --- GET /collections ------------------------------------------------------------

const getCollectionsRoute = createRoute({
  method: 'get',
  path: '/collections',
  tags: ['Collection'],
  summary: "Lister les collections d'indicateurs",
  description:
    "Chaque item inclut `indicateurIds`, triés par ordre d'insertion dans le collection (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { query: listCollectionsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionListApiModelSchema } },
      description: 'Liste paginée des collections',
    },
  },
})

// --- GET /collections/:id --------------------------------------------------------

const detailParamsSchema = z.object({
  id: collectionPublicIdSchema,
})

const getCollectionByIdRoute = createRoute({
  method: 'get',
  path: '/collections/{id}',
  tags: ['Collection'],
  summary: 'Récupérer un collection par identifiant public',
  description:
    "La réponse inclut `indicateurIds` triés par ordre d'insertion (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection trouvé',
    },
  },
})

// --- GET /collections/:id/taux-progression ---------------------------------------

const getCollectionTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/collections/{id}/taux-progression',
  tags: ['Collection'],
  summary: "Récupérer le taux de progression agrégé d'un collection pour un individu",
  description:
    'Retourne la moyenne pondérée du dernier taux de progression connu de chaque indicateur ' +
    "du collection pour l'individu demandé. La pondération est lue sur la jonction " +
    '`collection_indicateur.ponderation` (par défaut 1). Règle tout-ou-rien : si au moins un indicateur du collection ' +
    "n'a pas de dernier taux calculable (aucun objectif, aucune valeur, ou dernier point avec " +
    '`valeurCible = 0`), le champ `tauxProgression` global vaut `null`. Le tableau ' +
    "`contributions` est toujours renseigné, ce qui permet au client d'identifier les " +
    'indicateurs bloquants. Granularité de troncature fixée à `month` (cf. ' +
    '`docs/architecture/taux-progression.md`). Le taux est tronqué à 2 décimales (ROUND_DOWN) ' +
    'pour préserver la sémantique « ne jamais afficher 100 % avant atteinte stricte ». ' +
    "Renvoie 404 (`ENTITY_NOT_FOUND`) si le collection ou l'individu est introuvable.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    query: getCollectionTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionTauxProgressionApiModelSchema } },
      description: "Taux de progression du collection pour l'individu demandé",
    },
    400: erreur400,
    404: erreur404,
  },
})

// --- App registration --------------------------------------------------------

export const collectionRoutes = createOpenApiHono()

collectionRoutes.openapi(getCollectionsRoute, async (context) => {
  const { recherche, rechercheIdentifiant, cursor, pageSize } = context.req.valid('query')

  return listCollections({ recherche, rechercheIdentifiant, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

collectionRoutes.openapi(getCollectionByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getCollectionByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

collectionRoutes.openapi(getCollectionTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return getCollectionTauxProgression(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionTauxProgressionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /collections/:id/commentaires ------------------------------------------

const collectionCommentaireParamsSchema = z.object({ collectionId: collectionPublicIdSchema })

const creerCollectionCommentaireRoute = createRoute({
  method: 'post',
  path: '/collections/{collectionId}/commentaires',
  tags: ['Collection'],
  summary: 'Créer un commentaire global sur un collection',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerCollectionCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})

collectionRoutes.openapi(creerCollectionCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerCollectionCommentaire({ params, body }))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/commentaires -------------------------------------------

const listerCollectionCommentairesRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/commentaires',
  tags: ['Collection'],
  summary: "Lister les commentaires globaux d'un collection",
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: listerCollectionCommentairesQuerySchema,
  },
  responses: reponseListe,
})

collectionRoutes.openapi(listerCollectionCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCollectionCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/commentaires/brouillon ---------------------------------

const getCollectionBrouillonRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/commentaires/brouillon',
  tags: ['Collection'],
  summary: 'Récupérer mon brouillon courant (collection global)',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: recupererCollectionBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

collectionRoutes.openapi(getCollectionBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(collectionConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/niveaux-confiance --------------------------------------

const listerNiveauxParCommentairesCollectionRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/niveaux-confiance',
  tags: ['Collection', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (collection global)',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

collectionRoutes.openapi(listerNiveauxParCommentairesCollectionRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(collectionConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
