import { serve } from '@hono/node-server'

import { env } from '@/env'
import { logger } from '@/framework/logger/logger'

import { app } from './app'

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info({ port: info.port }, 'kpilote-api listening')
})
