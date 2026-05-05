import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { env } from '@/env'
import { databaseContext } from '@/framework/persistence/databaseContext'

import { app } from './app'

const server = new Hono()
server.use('*', databaseContext)
server.route('/', app)

serve({ fetch: server.fetch, port: env.PORT }, (info) => {
  console.log(`mb-api listening on http://localhost:${info.port}`)
})
