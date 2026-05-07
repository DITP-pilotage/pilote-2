import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { meApiModelSchema } from '@pilote/mb-shared/me'

import { requireUser } from '@/framework/auth/userContext'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'

const MeOkSchema = meApiModelSchema.openapi('Me')

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Authentication'],
  summary: "Renvoyer l'utilisateur authentifié",
  security: [{ bearer: [] }],
  responses: {
    200: {
      content: { 'application/json': { schema: MeOkSchema } },
      description: 'Utilisateur authentifié',
    },
  },
})

export const me = new OpenAPIHono()

me.openapi(meRoute, (context) => {
  const user = requireUser()
  return jsonResponseOk({
    context,
    data: {
      userId: user.id,
      prenom: user.prenom,
      nom: user.nom,
    },
    schema: MeOkSchema,
    status: 200,
  })
})
