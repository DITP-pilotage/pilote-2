import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'

import { env } from '@/env'
import { health } from '@/healthcheck/routes/health'
import { indicateurRoutes } from '@/indicateur/routes'
import { sharedMessage } from '@/shared/routes/sharedMessage'

export const app = new OpenAPIHono()

app.use('*', cors({ origin: env.CORS_ORIGINS, credentials: true }))

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)
app.route('/', sharedMessage)
app.route('/', indicateurRoutes)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))
