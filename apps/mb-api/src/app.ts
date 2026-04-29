import 'dotenv/config'

import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'

import { health } from '@/healthcheck/routes/health.js'

export const app = new OpenAPIHono()

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))
