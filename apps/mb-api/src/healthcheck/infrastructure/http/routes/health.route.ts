import { Hono } from 'hono'

import { checkHealth } from '@/healthcheck/queries/check-health.js'

export const healthRoute = new Hono()

healthRoute.get('/health', async (context) => {
  const result = await checkHealth()
  return result.match(
    (ok) => context.json(ok, 200),
    (error) => context.json({ status: error.status, database: error.database }, 503),
  )
})
