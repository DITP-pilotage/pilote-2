import { createRoute, z } from '@hono/zod-openapi'
import {
  adminConversationListSchema,
  adminConversationSchema,
  adminConversationsQuerySchema,
  assistantAccesSchema,
  setActifBodySchema,
} from '@pilote/kpilote-shared/assistant/admin'

import { grantAccess, readAccess, revokeAccess, setActif } from '@/assistant/admin/access'
import { getAdminConversation, listAdminConversations } from '@/assistant/admin/conversations'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400, erreur403, erreur404, succes200 } from '@/framework/openapi/responses'

export const assistantAdminRoutes = createOpenApiHono()

const requireAdmin = () =>
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

const AccessSchema = assistantAccesSchema.openapi('AssistantAcces')
const accessResponses = { 200: succes200('Accès à l’assistant', AccessSchema), 403: erreur403 }
const utilisateurParams = z.object({ utilisateurId: z.uuid() })

const readAccessRoute = createRoute({
  method: 'get',
  path: '/assistant/admin/acces',
  tags: ['Assistant (administration)'],
  summary: 'Lire l’accès à l’assistant',
  description: 'L’interrupteur général et les utilisateurs autorisés. Clé API ADMIN.',
  middleware: [requireAuthentication],
  responses: accessResponses,
})

const setActifRoute = createRoute({
  method: 'put',
  path: '/assistant/admin/acces/actif',
  tags: ['Assistant (administration)'],
  summary: 'Ouvrir ou couper l’assistant',
  description: 'Coupé, personne n’y a accès, utilisateurs autorisés compris. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: setActifBodySchema } }, required: true },
  },
  responses: { ...accessResponses, 400: erreur400 },
})

const grantRoute = createRoute({
  method: 'put',
  path: '/assistant/admin/acces/utilisateurs/{utilisateurId}',
  tags: ['Assistant (administration)'],
  summary: 'Autoriser un utilisateur',
  description: 'Idempotent. Utilisateur inconnu : 404. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: { params: utilisateurParams },
  responses: { ...accessResponses, 404: erreur404 },
})

const revokeRoute = createRoute({
  method: 'delete',
  path: '/assistant/admin/acces/utilisateurs/{utilisateurId}',
  tags: ['Assistant (administration)'],
  summary: 'Retirer un utilisateur',
  description: 'Idempotent. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: { params: utilisateurParams },
  responses: accessResponses,
})

const listConversationsRoute = createRoute({
  method: 'get',
  path: '/assistant/admin/conversations',
  tags: ['Assistant (administration)'],
  summary: 'Lister toutes les conversations',
  description:
    'Toutes les conversations, des plus récentes aux plus anciennes, avec leurs feedbacks, sans l’identité de leur auteur. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: { query: adminConversationsQuerySchema },
  responses: {
    200: succes200(
      'Conversations',
      adminConversationListSchema.openapi('AssistantAdminConversationList'),
    ),
    400: erreur400,
    403: erreur403,
  },
})

const getConversationRoute = createRoute({
  method: 'get',
  path: '/assistant/admin/conversations/{id}',
  tags: ['Assistant (administration)'],
  summary: 'Lire une conversation',
  description:
    'Les messages et, pour chaque réponse, son évaluation et sa trace, sans l’identité de l’auteur. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: succes200('Conversation', adminConversationSchema.openapi('AssistantAdminConversation')),
    403: erreur403,
    404: erreur404,
  },
})

assistantAdminRoutes.openapi(readAccessRoute, async (context) => {
  requireAdmin()
  return context.json(await readAccess(), 200)
})

assistantAdminRoutes.openapi(setActifRoute, async (context) => {
  requireAdmin()
  const { actif } = context.req.valid('json')
  return context.json(await setActif(actif), 200)
})

assistantAdminRoutes.openapi(grantRoute, async (context) => {
  requireAdmin()
  const { utilisateurId } = context.req.valid('param')
  return context.json(await grantAccess(utilisateurId), 200)
})

assistantAdminRoutes.openapi(revokeRoute, async (context) => {
  requireAdmin()
  const { utilisateurId } = context.req.valid('param')
  return context.json(await revokeAccess(utilisateurId), 200)
})

assistantAdminRoutes.openapi(listConversationsRoute, async (context) => {
  requireAdmin()
  return context.json(await listAdminConversations(context.req.valid('query')), 200)
})

assistantAdminRoutes.openapi(getConversationRoute, async (context) => {
  requireAdmin()
  return context.json(await getAdminConversation(context.req.valid('param').id), 200)
})
