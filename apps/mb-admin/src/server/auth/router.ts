import { Hono } from 'hono'
import { z } from 'zod'

import { ENVIRONMENTS, type Environment } from '@/server/environments'
import { fetchWhoami } from '@/server/mbApi'
import {
  clearSession,
  forgetKey,
  readSession,
  readVault,
  rememberKey,
  writeSession,
} from '@/server/session'

const apiKeySchema = z.string().regex(/^pilote_live_[A-Za-z0-9_-]+$/)

const confirmBodySchema = z.object({
  environment: z.enum(ENVIRONMENTS),
  apiKey: apiKeySchema,
})

const environmentBodySchema = z.object({ environment: z.enum(ENVIRONMENTS) })

// Préfixe affichable (jamais la clé entière) : `pilote_live_` + quelques caractères.
const keyPrefix = (apiKey: string): string => apiKey.slice(0, 18)

export const authRouter = new Hono()

authRouter.get('/session', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json(null)
  return context.json({ environment: session.environment, label: session.label })
})

// Clés validées mémorisées, par environnement : label + préfixe uniquement.
authRouter.get('/remembered', async (context) => {
  const vault = await readVault(context)
  const result: Partial<Record<Environment, { label: string; prefix: string }>> = {}
  for (const environment of ENVIRONMENTS) {
    const entry = vault[environment]
    if (entry) result[environment] = { label: entry.label, prefix: keyPrefix(entry.apiKey) }
  }
  return context.json(result)
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
  await rememberKey(context, environment, { apiKey, label: whoami.label })
  context.header('Cache-Control', 'no-store')
  return context.json({ environment, label: whoami.label })
})

// Réutilise une clé mémorisée : on la re-valide (révocation/expiration) avant
// d'ouvrir la session.
authRouter.post('/use', async (context) => {
  const parsed = environmentBodySchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) return context.json({ error: 'invalid_request' }, 400)

  const { environment } = parsed.data
  const vault = await readVault(context)
  const entry = vault[environment]
  if (!entry) return context.json({ error: 'not_remembered' }, 404)

  let whoami: Awaited<ReturnType<typeof fetchWhoami>>
  try {
    whoami = await fetchWhoami(environment, entry.apiKey)
  } catch {
    return context.json({ error: 'environment_unreachable' }, 502)
  }
  if (!whoami) {
    await forgetKey(context, environment)
    return context.json({ error: 'invalid_key' }, 401)
  }

  await writeSession(context, { environment, apiKey: entry.apiKey, label: whoami.label })
  await rememberKey(context, environment, { apiKey: entry.apiKey, label: whoami.label })
  context.header('Cache-Control', 'no-store')
  return context.json({ environment, label: whoami.label })
})

authRouter.post('/forget', async (context) => {
  const parsed = environmentBodySchema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) return context.json({ error: 'invalid_request' }, 400)
  await forgetKey(context, parsed.data.environment)
  return context.body(null, 204)
})

authRouter.post('/logout', (context) => {
  clearSession(context)
  return context.body(null, 204)
})
