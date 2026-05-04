import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'

import { me } from '@/authentication/routes/me'
import { env } from '@/env'
import { authContext } from '@/framework/auth/authContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { health } from '@/healthcheck/routes/health'
import { indicateurRoutes } from '@/indicateur/routes'
import { sharedMessage } from '@/shared/routes/sharedMessage'

export const app = new OpenAPIHono()

app.use('*', cors({ origin: env.CORS_ORIGINS, credentials: false }))
app.use('*', authContext)

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)
app.route('/', sharedMessage)
app.route('/', indicateurRoutes)
app.route('/', me)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
})

app.openAPIRegistry.registerComponent('securitySchemes', 'bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

registerErrorHandler(app)
