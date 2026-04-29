import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse.js'
import { getHealth } from '@/healthcheck/queries/getHealth.js'

const HealthOkSchema = z
  .object({
    status: z.literal('ok'),
    database: z.literal('ok'),
  })
  .openapi('HealthOk')

const HealthErrorSchema = z
  .object({
    status: z.literal('error'),
    database: z.literal('error'),
  })
  .openapi('HealthError')

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Healthcheck'],
  summary: 'Vérifier la santé du service',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthOkSchema } },
      description: 'Service en bonne santé',
    },
    503: {
      content: { 'application/json': { schema: HealthErrorSchema } },
      description: 'Service indisponible',
    },
  },
})

export const health = new OpenAPIHono()

health.openapi(healthRoute, async (context) => {
  return getHealth().match(
    (data) => jsonResponseOk({ context, data, schema: HealthOkSchema, status: 200 }),
    (error) => jsonResponseError({ context, error, schema: HealthErrorSchema, status: 503 }),
  )
})
