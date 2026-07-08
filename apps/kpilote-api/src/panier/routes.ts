import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerPanierCommentaireBodySchema,
  listerPanierCommentairesQuerySchema,
  recupererPanierBrouillonQuerySchema,
} from '@pilote/kpilote-shared/commentaire'
import { listerNiveauxConfianceQuerySchema } from '@pilote/kpilote-shared/niveauConfiance'
import {
  listPaniersQuerySchema,
  panierApiModelSchema,
  panierListApiModelSchema,
} from '@pilote/kpilote-shared/panier'
import {
  getPanierTauxProgressionQuerySchema,
  panierTauxProgressionApiModelSchema,
} from '@pilote/kpilote-shared/panierTauxProgression'
import { panierPublicIdSchema } from '@pilote/kpilote-shared/publicIds'

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
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { creerPanierCommentaire, panierConfig } from '@/panier/commands/creerPanierCommentaire'
import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { getPanierTauxProgression } from '@/panier/queries/getPanierTauxProgression'
import { listPaniers } from '@/panier/queries/listPaniers'
import { listerPanierCommentaires } from '@/panier/queries/listerPanierCommentaires'

const PanierApiModelSchema = panierApiModelSchema.openapi('PanierApiModel')
const PanierListApiModelSchema = panierListApiModelSchema.openapi('PanierListApiModel')
const PanierTauxProgressionApiModelSchema = panierTauxProgressionApiModelSchema.openapi(
  'PanierTauxProgressionApiModel',
)

// --- GET /paniers ------------------------------------------------------------

const getPaniersRoute = createRoute({
  method: 'get',
  path: '/paniers',
  tags: ['Panier'],
  summary: "Lister les paniers d'indicateurs",
  description:
    "Chaque item inclut `indicateurIds`, triés par ordre d'insertion dans le panier (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { query: listPaniersQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierListApiModelSchema } },
      description: 'Liste paginée des paniers',
    },
  },
})

// --- GET /paniers/:id --------------------------------------------------------

const detailParamsSchema = z.object({
  id: panierPublicIdSchema,
})

const getPanierByIdRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}',
  tags: ['Panier'],
  summary: 'Récupérer un panier par identifiant public',
  description:
    "La réponse inclut `indicateurIds` triés par ordre d'insertion (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierApiModelSchema } },
      description: 'Panier trouvé',
    },
  },
})

// --- GET /paniers/:id/taux-progression ---------------------------------------

const getPanierTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}/taux-progression',
  tags: ['Panier'],
  summary: "Récupérer le taux de progression agrégé d'un panier pour un individu",
  description:
    'Retourne la moyenne pondérée du dernier taux de progression connu de chaque indicateur ' +
    "du panier pour l'individu demandé. La pondération est lue sur la jonction " +
    '`panier_indicateur.ponderation` (par défaut 1). Règle tout-ou-rien : si au moins un indicateur du panier ' +
    "n'a pas de dernier taux calculable (aucun objectif, aucune valeur, ou dernier point avec " +
    '`valeurCible = 0`), le champ `tauxProgression` global vaut `null`. Le tableau ' +
    "`contributions` est toujours renseigné, ce qui permet au client d'identifier les " +
    'indicateurs bloquants. Granularité de troncature fixée à `month` (cf. ' +
    '`docs/architecture/taux-progression.md`). Le taux est tronqué à 2 décimales (ROUND_DOWN) ' +
    'pour préserver la sémantique « ne jamais afficher 100 % avant atteinte stricte ». ' +
    "Renvoie 404 (`ENTITY_NOT_FOUND`) si le panier ou l'individu est introuvable.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    query: getPanierTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierTauxProgressionApiModelSchema } },
      description: "Taux de progression du panier pour l'individu demandé",
    },
    400: erreur400,
    404: erreur404,
  },
})

// --- App registration --------------------------------------------------------

export const panierRoutes = new OpenAPIHono()

panierRoutes.openapi(getPaniersRoute, async (context) => {
  const { recherche, rechercheIdentifiant, cursor, pageSize } = context.req.valid('query')

  return listPaniers({ recherche, rechercheIdentifiant, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

panierRoutes.openapi(getPanierByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getPanierByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierApiModelSchema,
        status: 200,
      }),
    never,
  )
})

panierRoutes.openapi(getPanierTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return getPanierTauxProgression(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierTauxProgressionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /paniers/:id/commentaires ------------------------------------------

const panierCommentaireParamsSchema = z.object({ panierId: panierPublicIdSchema })

const creerPanierCommentaireRoute = createRoute({
  method: 'post',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Panier'],
  summary: 'Créer un commentaire global sur un panier',
  middleware: [requireAuthentication],
  request: {
    params: panierCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerPanierCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})

panierRoutes.openapi(creerPanierCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerPanierCommentaire({ params, body }))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /paniers/:id/commentaires -------------------------------------------

const listerPanierCommentairesRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Panier'],
  summary: 'Lister les commentaires globaux d’un panier',
  middleware: [requireAuthentication],
  request: {
    params: panierCommentaireParamsSchema,
    query: listerPanierCommentairesQuerySchema,
  },
  responses: reponseListe,
})

panierRoutes.openapi(listerPanierCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerPanierCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /paniers/:id/commentaires/brouillon ---------------------------------

const getPanierBrouillonRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/commentaires/brouillon',
  tags: ['Panier'],
  summary: 'Récupérer mon brouillon courant (panier global)',
  middleware: [requireAuthentication],
  request: {
    params: panierCommentaireParamsSchema,
    query: recupererPanierBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

panierRoutes.openapi(getPanierBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(panierConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /paniers/:id/niveaux-confiance --------------------------------------

const listerNiveauxParCommentairesPanierRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/niveaux-confiance',
  tags: ['Panier', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (panier global)',
  middleware: [requireAuthentication],
  request: {
    params: panierCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

panierRoutes.openapi(listerNiveauxParCommentairesPanierRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(panierConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
