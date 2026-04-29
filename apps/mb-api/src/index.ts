import 'dotenv/config'

import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'

import { health } from '@/healthcheck/routes/health.js'

const app = new OpenAPIHono()

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Pilote API', version: '0.1.0' },
})

app.get('/docs', swaggerUI({ url: '/openapi.json' }))

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`mb-api listening on http://localhost:${info.port}`)
})
