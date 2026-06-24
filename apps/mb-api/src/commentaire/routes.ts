import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
  creerIndicateurIndividuCommentaireBodySchema,
  creerPanierCommentaireBodySchema,
  creerPanierIndividuCommentaireBodySchema,
  listerCommentairesQuerySchema,
  modifierCommentaireBodySchema,
} from '@pilote/mb-shared/commentaire'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  panierPublicIdSchema,
} from '@pilote/mb-shared/publicIds'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { modifierCommentaire } from '@/commentaire/commands/modifierCommentaire'
import { supprimerCommentaire } from '@/commentaire/commands/supprimerCommentaire'
import { listerCommentaires } from '@/commentaire/queries/listerCommentaires'
import { indicateurIndividuConfig, panierConfig, panierIndividuConfig } from '@/commentaire/sujets'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
const CommentaireListApiModelSchema =
  commentaireListApiModelSchema.openapi('CommentaireListApiModel')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const commentaireRoutes = new OpenAPIHono()

const reponseCommentaire = {
  200: {
    content: { 'application/json': { schema: CommentaireApiModelSchema } },
    description: 'Commentaire',
  },
  400: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Requête invalide',
  },
  403: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Permission insuffisante',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Sujet introuvable',
  },
}

const reponseListe = {
  200: {
    content: { 'application/json': { schema: CommentaireListApiModelSchema } },
    description: 'Liste paginée',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Sujet introuvable',
  },
}

// --- indicateur + individu ---------------------------------------------------

const creerIndicateurIndividuRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire sur un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({
      indicateurId: indicateurPublicIdSchema,
      individuId: individuPublicIdSchema,
    }),
    body: {
      content: { 'application/json': { schema: creerIndicateurIndividuCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})
commentaireRoutes.openapi(creerIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () =>
    creerCommentaire(indicateurIndividuConfig, { params, body }),
  )
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

const listerIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires d’un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({
      indicateurId: indicateurPublicIdSchema,
      individuId: individuPublicIdSchema,
    }),
    query: listerCommentairesQuerySchema,
  },
  responses: reponseListe,
})
commentaireRoutes.openapi(listerIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(indicateurIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- panier + individu -------------------------------------------------------

const creerPanierIndividuRoute = createRoute({
  method: 'post',
  path: '/paniers/{panierId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire sur un panier pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema, individuId: individuPublicIdSchema }),
    body: {
      content: { 'application/json': { schema: creerPanierIndividuCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})
commentaireRoutes.openapi(creerPanierIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () =>
    creerCommentaire(panierIndividuConfig, { params, body }),
  )
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

const listerPanierIndividuRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/individus/{individuId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires d’un panier pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema, individuId: individuPublicIdSchema }),
    query: listerCommentairesQuerySchema,
  },
  responses: reponseListe,
})
commentaireRoutes.openapi(listerPanierIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(panierIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- panier global -----------------------------------------------------------

const creerPanierRoute = createRoute({
  method: 'post',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Créer un commentaire global sur un panier',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema }),
    body: {
      content: { 'application/json': { schema: creerPanierCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})
commentaireRoutes.openapi(creerPanierRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerCommentaire(panierConfig, { params, body }))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

const listerPanierRoute = createRoute({
  method: 'get',
  path: '/paniers/{panierId}/commentaires',
  tags: ['Commentaire'],
  summary: 'Lister les commentaires globaux d’un panier',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ panierId: panierPublicIdSchema }),
    query: listerCommentairesQuerySchema,
  },
  responses: reponseListe,
})
commentaireRoutes.openapi(listerPanierRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCommentaires(panierConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- mutation socle (par id) -------------------------------------------------

const modifierRoute = createRoute({
  method: 'put',
  path: '/commentaires/{commentaireId}',
  tags: ['Commentaire'],
  summary: 'Modifier un commentaire (auteur uniquement)',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ commentaireId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: modifierCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})
commentaireRoutes.openapi(modifierRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierCommentaire(commentaireId, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

const supprimerRoute = createRoute({
  method: 'delete',
  path: '/commentaires/{commentaireId}',
  tags: ['Commentaire'],
  summary: 'Supprimer un commentaire (auteur uniquement)',
  middleware: [requireAuthentication],
  request: { params: z.object({ commentaireId: z.string().uuid() }) },
  responses: {
    204: { description: 'Commentaire supprimé' },
    403: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Permission insuffisante',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Commentaire introuvable',
    },
  },
})
commentaireRoutes.openapi(supprimerRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const result = await withTransaction(async () => supprimerCommentaire(commentaireId))
  return result.match(() => context.body(null, 204), never)
})
