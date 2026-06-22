import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  listPaniersQuerySchema,
  panierApiModelSchema,
  panierListApiModelSchema,
} from '@pilote/mb-shared/panier'
import { panierContactsUtilesApiModelSchema } from '@pilote/mb-shared/panierContactUtile'
import { panierResponsablesApiModelSchema } from '@pilote/mb-shared/panierResponsable'
import {
  getPanierTauxProgressionQuerySchema,
  panierTauxProgressionApiModelSchema,
} from '@pilote/mb-shared/panierTauxProgression'
import { panierPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { getPanierContactsUtiles } from '@/panier/queries/getPanierContactsUtiles'
import { getPanierResponsables } from '@/panier/queries/getPanierResponsables'
import { getPanierTauxProgression } from '@/panier/queries/getPanierTauxProgression'
import { listPaniers } from '@/panier/queries/listPaniers'

const PanierApiModelSchema = panierApiModelSchema.openapi('PanierApiModel')
const PanierListApiModelSchema = panierListApiModelSchema.openapi('PanierListApiModel')
const PanierTauxProgressionApiModelSchema = panierTauxProgressionApiModelSchema.openapi(
  'PanierTauxProgressionApiModel',
)
const PanierResponsablesApiModelSchema = panierResponsablesApiModelSchema.openapi(
  'PanierResponsablesApiModel',
)
const PanierContactsUtilesApiModelSchema = panierContactsUtilesApiModelSchema.openapi(
  'PanierContactsUtilesApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

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
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Panier ou individu introuvable',
    },
  },
})

// --- GET /paniers/:id/responsables -------------------------------------------

const getPanierResponsablesRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}/responsables',
  tags: ['Panier'],
  summary: "Lister les responsables d'un panier",
  description:
    'Retourne la liste des utilisateurs désignés responsables du panier, triés par ordre ' +
    "d'assignation (createdAt ASC). Accessible à tout principal pouvant lire le panier " +
    '(visibilite PUBLIC ou permission READ/WRITE explicite). ' +
    'Renvoie 404 (`ENTITY_NOT_FOUND`) si le panier est introuvable ou inaccessible.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierResponsablesApiModelSchema } },
      description: 'Liste des responsables du panier',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Panier introuvable',
    },
  },
})

// --- GET /paniers/:id/contacts-utiles ----------------------------------------

const getPanierContactsUtilesRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}/contacts-utiles',
  tags: ['Panier'],
  summary: "Lister les contacts utiles d'un panier",
  description:
    'Retourne les contacts utiles du panier, regroupés par organisme et triés alphabétiquement. ' +
    'Accessible à tout principal pouvant lire le panier ' +
    '(visibilite PUBLIC ou permission READ/WRITE explicite). ' +
    'Renvoie 404 (`ENTITY_NOT_FOUND`) si le panier est introuvable ou inaccessible.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierContactsUtilesApiModelSchema } },
      description: 'Contacts utiles du panier groupés par organisme',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Panier introuvable',
    },
  },
})

// --- App registration --------------------------------------------------------

export const panierRoutes = new OpenAPIHono()

panierRoutes.openapi(getPaniersRoute, async (context) => {
  const { cursor, pageSize } = context.req.valid('query')

  return listPaniers({ cursor, pageSize }).match(
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

panierRoutes.openapi(getPanierResponsablesRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getPanierResponsables(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierResponsablesApiModelSchema,
        status: 200,
      }),
    never,
  )
})

panierRoutes.openapi(getPanierContactsUtilesRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getPanierContactsUtiles(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierContactsUtilesApiModelSchema,
        status: 200,
      }),
    never,
  )
})
