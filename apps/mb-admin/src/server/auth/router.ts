import { Hono } from 'hono'
import { z } from 'zod'

import { ENVIRONMENTS } from '@/server/environments'
import { fetchWhoami } from '@/server/mbApi'
import { clearSession, readSession, writeSession } from '@/server/session'

const apiKeySchema = z.string().regex(/^pilote_live_[A-Za-z0-9_-]+$/)

const confirmBodySchema = z.object({
  environment: z.enum(ENVIRONMENTS),
  apiKey: apiKeySchema,
})

export const authRouter = new Hono()

authRouter.get('/session', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json(null)
  return context.json({ environment: session.environment, label: session.label })
})

authRouter.post('/confirm', async (context) => {
  const parsed = confirmBodySchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) return context.json({ error: 'invalid_request' }, 400)

  const { environment, apiKey } = parsed.data
  let whoami: Awaited<ReturnType<typeof fetchWhoami>>
  try {
    whoami = await fetchWhoami(environment, apiKey)
  } catch {
    return context.json({ error: 'environment_unreachable' }, 502)
  }
  if (!whoami) return context.json({ error: 'invalid_key' }, 401)

  await writeSession(context, { environment, apiKey, label: whoami.label })
  context.header('Cache-Control', 'no-store')
  return context.json({ environment, label: whoami.label })
})

authRouter.post('/logout', (context) => {
  clearSession(context)
  return context.body(null, 204)
})
