import 'dotenv/config'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { health } from '@/healthcheck/routes/health.js'

const app = new Hono()

app.get('/', (context) => context.json({ hello: 'world' }))
app.route('/', health)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`mb-api listening on http://localhost:${info.port}`)
})
