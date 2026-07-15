import { Hono } from 'hono'

import { mbApiUrlFor } from '@/server/environments'
import { readSession } from '@/server/session'

// En-têtes que le client a le droit de transmettre à l'API cible. `Authorization`
// est volontairement EXCLU : il est injecté côté serveur et ne doit jamais être
// pilotable par le navigateur.
const FORWARDABLE_HEADERS = new Set(['content-type', 'accept', 'x-request-id'])

// Rejette toute tentative de traversal / d'URL absolue AVANT la normalisation.
const isSuspicious = (subPath: string): boolean =>
  subPath.includes('..') ||
  subPath.includes('\\') ||
  subPath.startsWith('/') ||
  /%2e/i.test(subPath) ||
  /%2f/i.test(subPath)

export const consoleRouter = new Hono()

consoleRouter.get('/meta', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)
  return context.json({
    environment: session.environment,
    baseUrl: mbApiUrlFor(session.environment),
  })
})

consoleRouter.get('/openapi.json', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  const base = mbApiUrlFor(session.environment).replace(/\/$/, '')
  const upstream = await fetch(`${base}/openapi.json`, {
    headers: { Authorization: `Bearer ${session.apiKey}` },
  })
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  return new Response(upstream.body, { status: upstream.status, headers })
})

consoleRouter.all('/proxy/*', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  const subPath = context.req.path.replace(/^\/console\/proxy\//, '')
  if (isSuspicious(subPath)) return context.json({ error: 'forbidden' }, 403)

  const base = new URL(mbApiUrlFor(session.environment))
  const basePath = base.pathname.replace(/\/$/, '')
  const url = new URL(`${basePath}/${subPath}`, base)
  url.search = new URL(context.req.url).search

  // Défense en profondeur : après normalisation, on doit toujours être sur
  // l'origine de l'environnement sélectionné. Pas d'allowlist de ressources :
  // les appels arbitraires sont le but, mais bornés à cette origine.
  if (url.origin !== base.origin) return context.json({ error: 'forbidden' }, 403)

  const forwarded = new Headers({ Authorization: `Bearer ${session.apiKey}` })
  context.req.raw.headers.forEach((value, key) => {
    if (FORWARDABLE_HEADERS.has(key.toLowerCase())) forwarded.set(key, value)
  })

  const isBodyless = context.req.method === 'GET' || context.req.method === 'HEAD'
  const init: RequestInit = {
    method: context.req.method,
    headers: forwarded,
    ...(isBodyless ? {} : { body: await context.req.text() }),
  }

  const upstream = await fetch(url, init)
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  return new Response(upstream.body, { status: upstream.status, headers })
})
