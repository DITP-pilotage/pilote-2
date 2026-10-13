import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { logger } from './logger.ts'

const port = Number(process.env.PORT ?? '3000')
const internalPort = Number(process.env.INTERNAL_PORT ?? '8080')
const targetOrigin = `http://127.0.0.1:${internalPort}`

const app = createApp({ targetOrigin })

serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port, targetOrigin }, 'listening')
})
