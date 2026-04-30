import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { type AuthVariables, requireUser } from '@/authentication/middleware/requireUser'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'

const MeOkSchema = z
  .object({
    id: z.string(),
    source: z.literal('jwt'),
  })
  .openapi('Me')

const UnauthorizedSchema = z
  .object({
    error: z.literal('unauthorized'),
  })
  .openapi('Unauthorized')

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Authentication'],
  summary: "Renvoyer l'utilisateur authentifié",
  security: [{ bearer: [] }],
  middleware: [requireUser] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: MeOkSchema } },
      description: 'Utilisateur authentifié',
    },
    401: {
      content: { 'application/json': { schema: UnauthorizedSchema } },
      description: 'Non authentifié',
    },
  },
})

export const me = new OpenAPIHono<{ Variables: AuthVariables }>()

me.openapi(meRoute, (context) => {
  const user = context.get('user')
  return jsonResponseOk({ context, data: user, schema: MeOkSchema, status: 200 })
})
