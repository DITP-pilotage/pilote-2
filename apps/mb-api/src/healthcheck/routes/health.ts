import { Hono } from 'hono'

import { getHealth } from '@/healthcheck/queries/getHealth.js'

export const health = new Hono()

health.get('/health', async (context) => {
  return getHealth().match(
    (ok) => context.json(ok, 200),
    (error) => context.json({ status: error.status, database: error.database }, 503),
  )
})
