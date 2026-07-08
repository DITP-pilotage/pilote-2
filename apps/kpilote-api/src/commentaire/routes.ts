import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { modifierCommentaireBodySchema } from '@pilote/kpilote-shared/commentaire'

import { modifierCommentaire } from '@/commentaire/commands/modifierCommentaire'
import { supprimerCommentaire } from '@/commentaire/commands/supprimerCommentaire'
import { CommentaireApiModelSchema, reponseCommentaire } from '@/commentaire/openapi'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const commentaireRoutes = new OpenAPIHono()

// --- PUT /commentaires/:commentaireId ----------------------------------------

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

// --- DELETE /commentaires/:commentaireId -------------------------------------

const supprimerRoute = createRoute({
  method: 'delete',
  path: '/commentaires/{commentaireId}',
  tags: ['Commentaire'],
  summary: 'Supprimer un commentaire (auteur uniquement)',
  middleware: [requireAuthentication],
  request: { params: z.object({ commentaireId: z.string().uuid() }) },
  responses: {
    204: { description: 'Commentaire supprimé' },
    403: erreur403,
    404: erreur404,
  },
})

commentaireRoutes.openapi(supprimerRoute, async (context) => {
  const { commentaireId } = context.req.valid('param')
  const result = await withTransaction(async () => supprimerCommentaire(commentaireId))
  return result.match(() => context.body(null, 204), never)
})
