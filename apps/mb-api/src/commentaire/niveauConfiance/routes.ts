import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerNiveauConfianceBodySchema,
  modifierNiveauConfianceBodySchema,
  niveauConfianceApiModelSchema,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/commentaire'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { pageSizeSchema, paginationCursorSchema } from '@pilote/mb-shared/pagination'
import {
  indicateurPublicIdSchema,
  individuPublicIdSchema,
  panierPublicIdSchema,
} from '@pilote/mb-shared/publicIds'

import { creerNiveauConfiance } from '@/commentaire/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/commentaire/niveauConfiance/commands/modifierNiveauConfiance'
import { getNiveauConfianceCourant } from '@/commentaire/niveauConfiance/queries/getNiveauConfianceCourant'
import { listerHistoriqueNiveauConfiance } from '@/commentaire/niveauConfiance/queries/listerHistoriqueNiveauConfiance'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { indicateurIndividuConfig } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { panierConfig } from '@/panier/commands/creerPanierCommentaire'
import { panierIndividuConfig } from '@/panier/commands/creerPanierIndividuCommentaire'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

const NiveauConfianceApiModelSchema =
  niveauConfianceApiModelSchema.openapi('NiveauConfianceApiModel')
const NiveauConfianceListApiModelSchema = niveauConfianceListApiModelSchema.openapi(
  'NiveauConfianceListApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

// Historique = listing des commentaires CONFIANCE (filtrage hardcodé côté query)
// → seulement la pagination est exposée à l'appelant.
const historiqueQuerySchema = z.object({
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})

export const niveauConfianceRoutes = new OpenAPIHono()

const reponseNc = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceApiModelSchema } },
    description: 'Niveau de confiance',
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
    description: 'Introuvable',
  },
}

const reponseHistorique = {
  200: {
    content: { 'application/json': { schema: NiveauConfianceListApiModelSchema } },
    description: 'Historique paginé',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Sujet introuvable',
  },
}

// --- indicateur + individu ---------------------------------------------------

const indicIndividuParams = z.object({
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema,
})

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Créer un niveau de confiance (indicateur + individu)',
    middleware: [requireAuthentication],
    request: {
      params: indicIndividuParams,
      body: {
        content: { 'application/json': { schema: creerNiveauConfianceBodySchema } },
        required: true,
      },
    },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const body = context.req.valid('json')
    const result = await withTransaction(async () =>
      creerNiveauConfiance(indicateurIndividuConfig, { params, body }),
    )
    return result.match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Niveau de confiance courant (indicateur + individu)',
    middleware: [requireAuthentication],
    request: { params: indicIndividuParams },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    return getNiveauConfianceCourant(indicateurIndividuConfig, { params }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/indicateurs/{indicateurId}/individus/{individuId}/niveau-confiance/historique',
    tags: ['NiveauConfiance'],
    summary: 'Historique des niveaux de confiance (indicateur + individu)',
    middleware: [requireAuthentication],
    request: { params: indicIndividuParams, query: historiqueQuerySchema },
    responses: reponseHistorique,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const query = context.req.valid('query')
    return listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
      never,
    )
  },
)

// --- panier + individu -------------------------------------------------------

const panierIndividuParams = z.object({
  panierId: panierPublicIdSchema,
  individuId: individuPublicIdSchema,
})

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/paniers/{panierId}/individus/{individuId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Créer un niveau de confiance (panier + individu)',
    middleware: [requireAuthentication],
    request: {
      params: panierIndividuParams,
      body: {
        content: { 'application/json': { schema: creerNiveauConfianceBodySchema } },
        required: true,
      },
    },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const body = context.req.valid('json')
    const result = await withTransaction(async () =>
      creerNiveauConfiance(panierIndividuConfig, { params, body }),
    )
    return result.match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/paniers/{panierId}/individus/{individuId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Niveau de confiance courant (panier + individu)',
    middleware: [requireAuthentication],
    request: { params: panierIndividuParams },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    return getNiveauConfianceCourant(panierIndividuConfig, { params }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/paniers/{panierId}/individus/{individuId}/niveau-confiance/historique',
    tags: ['NiveauConfiance'],
    summary: 'Historique des niveaux de confiance (panier + individu)',
    middleware: [requireAuthentication],
    request: { params: panierIndividuParams, query: historiqueQuerySchema },
    responses: reponseHistorique,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const query = context.req.valid('query')
    return listerHistoriqueNiveauConfiance(panierIndividuConfig, { params, query }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
      never,
    )
  },
)

// --- panier global -----------------------------------------------------------

const panierParams = z.object({ panierId: panierPublicIdSchema })

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/paniers/{panierId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Créer un niveau de confiance (panier global)',
    middleware: [requireAuthentication],
    request: {
      params: panierParams,
      body: {
        content: { 'application/json': { schema: creerNiveauConfianceBodySchema } },
        required: true,
      },
    },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const body = context.req.valid('json')
    const result = await withTransaction(async () =>
      creerNiveauConfiance(panierConfig, { params, body }),
    )
    return result.match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/paniers/{panierId}/niveau-confiance',
    tags: ['NiveauConfiance'],
    summary: 'Niveau de confiance courant (panier global)',
    middleware: [requireAuthentication],
    request: { params: panierParams },
    responses: reponseNc,
  }),
  async (context) => {
    const params = context.req.valid('param')
    return getNiveauConfianceCourant(panierConfig, { params }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/paniers/{panierId}/niveau-confiance/historique',
    tags: ['NiveauConfiance'],
    summary: 'Historique des niveaux de confiance (panier global)',
    middleware: [requireAuthentication],
    request: { params: panierParams, query: historiqueQuerySchema },
    responses: reponseHistorique,
  }),
  async (context) => {
    const params = context.req.valid('param')
    const query = context.req.valid('query')
    return listerHistoriqueNiveauConfiance(panierConfig, { params, query }).match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
      never,
    )
  },
)

// --- mutation par id (espace d'id unifié) ------------------------------------

niveauConfianceRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/niveau-confiance/{commentaireId}',
    tags: ['NiveauConfiance'],
    summary: 'Modifier un niveau de confiance (auteur uniquement)',
    middleware: [requireAuthentication],
    request: {
      params: z.object({ commentaireId: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: modifierNiveauConfianceBodySchema } },
        required: true,
      },
    },
    responses: reponseNc,
  }),
  async (context) => {
    const { commentaireId } = context.req.valid('param')
    const body = context.req.valid('json')
    const result = await withTransaction(async () => modifierNiveauConfiance(commentaireId, body))
    return result.match(
      (data) =>
        jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
      never,
    )
  },
)
