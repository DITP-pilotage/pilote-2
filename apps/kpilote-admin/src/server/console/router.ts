import { Hono } from 'hono'
import { z } from 'zod'

import { mbApiUrlFor } from '@/server/environments'
import { readSession } from '@/server/session'

// Rejette toute tentative de traversal / d'URL absolue AVANT la normalisation.
const isSuspicious = (subPath: string): boolean =>
  subPath.includes('..') ||
  subPath.includes('//') ||
  subPath.includes('\\') ||
  subPath.startsWith('/') ||
  /%2e/i.test(subPath) ||
  /%2f/i.test(subPath)

// Enveloppe décrivant la requête à forger côté serveur. La méthode et le path
// voyagent comme des données (pas dans l'URL du BFF), ce qui permet de poser des
// en-têtes que le `fetch` du navigateur interdirait (Host, Referer…).
const envelopeSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string(),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  body: z.string().default(''),
})

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

consoleRouter.post('/proxy', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  const raw: unknown = await context.req.json().catch(() => null)
  const parsed = envelopeSchema.safeParse(raw)
  if (!parsed.success) return context.json({ error: 'invalid_request' }, 400)
  const { method, path, headers: headerPairs, body } = parsed.data

  const queryIndex = path.indexOf('?')
  const rawPath = queryIndex === -1 ? path : path.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : path.slice(queryIndex + 1)
  const subPath = rawPath.replace(/^\/+/, '')
  if (isSuspicious(subPath)) return context.json({ error: 'forbidden' }, 403)

  const base = new URL(mbApiUrlFor(session.environment))
  const basePath = base.pathname.replace(/\/$/, '')
  const url = new URL(`${basePath}/${subPath}`, base)
  if (search) url.search = search

  // Défense en profondeur : après normalisation, on doit toujours être sur
  // l'origine de l'environnement sélectionné. Pas d'allowlist de ressources :
  // les appels arbitraires sont le but, mais bornés à cette origine.
  if (url.origin !== base.origin) return context.json({ error: 'forbidden' }, 403)

  const forwarded = new Headers()
  for (const { key, value } of headerPairs) {
    if (key.trim()) forwarded.set(key, value)
  }
  const isBodyless = method === 'GET'
  if (!isBodyless && body && !forwarded.has('content-type')) {
    forwarded.set('content-type', 'application/json')
  }
  // Toujours en dernier : le token est injecté serveur et prime sur toute valeur
  // fournie par le client (qui ne doit jamais piloter l'Authorization).
  forwarded.set('Authorization', `Bearer ${session.apiKey}`)

  const start = performance.now()
  const upstream = await fetch(url, {
    method,
    headers: forwarded,
    ...(isBodyless ? {} : { body }),
  })
  const responseBody = await upstream.text()
  const durationMs = Math.round(performance.now() - start)

  const responseHeaders: Record<string, string> = {}
  upstream.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  // Le BFF répond toujours 200 : le vrai status de l'API vit dans l'enveloppe.
  // Le timing est mesuré ici (latence réelle de l'appel upstream, hors hop BFF).
  context.header('Cache-Control', 'no-store')
  return context.json({
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
    durationMs,
    body: responseBody,
  })
})
