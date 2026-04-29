import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { SHARED_GREETING, type SharedMessage, sharedMessageSchema } from '@pilote/mb-shared'

import { jsonResponseOk } from '@/framework/openapi/jsonResponse'

const SharedMessageSchema = sharedMessageSchema.openapi('SharedMessage')

const sharedMessageRoute = createRoute({
  method: 'get',
  path: '/shared-message',
  tags: ['Shared'],
  summary: 'Retourner la constante partagée',
  responses: {
    200: {
      content: { 'application/json': { schema: SharedMessageSchema } },
      description: 'Message partagé',
    },
  },
})

export const sharedMessage = new OpenAPIHono()

sharedMessage.openapi(sharedMessageRoute, (context) => {
  const data: SharedMessage = { greeting: SHARED_GREETING }
  return jsonResponseOk({ context, data, schema: SharedMessageSchema, status: 200 })
})
