import { zValidator } from '@hono/zod-validator'
import { consoleRequestSchema, type ConsoleResponse } from '@pilote/kpilote-shared/console'
import { Hono } from 'hono'
import ky from 'ky'

import { kpiloteApiUrlFor } from '@/server/environments'
import { requireSession } from '@/server/session'

// Rejette toute tentative de traversal / d'URL absolue AVANT la construction de
// l'URL cible. Le `path` de l'enveloppe est un chemin pur (la querystring voyage
// à part), donc aucun `?`/`&` légitime à préserver ici.
const isSuspicious = (subPath: string): boolean =>
  subPath.includes('..') ||
  subPath.includes('//') ||
  subPath.includes('\\') ||
  subPath.startsWith('/') ||
  /%2e/i.test(subPath) ||
  /%2f/i.test(subPath)

export const consoleRouter = new Hono()

consoleRouter.get('/meta', async (context) => {
  const session = await requireSession(context)
  return context.json({
    environment: session.environment,
    baseUrl: kpiloteApiUrlFor(session.environment),
  })
})

consoleRouter.get('/openapi.json', async (context) => {
  const session = await requireSession(context)
  // La spec OpenAPI de l'API est publique : pas besoin du token pour la lire.
  const base = kpiloteApiUrlFor(session.environment).replace(/\/$/, '')
  const upstream = await ky.get(`${base}/openapi.json`, { throwHttpErrors: false })
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  return new Response(upstream.body, { status: upstream.status, headers })
})

consoleRouter.post('/proxy', zValidator('json', consoleRequestSchema), async (context) => {
  const session = await requireSession(context)
  const { method, path, query, headers: headerPairs, body } = context.req.valid('json')

  const subPath = path.replace(/^\/+/, '')
  if (isSuspicious(subPath)) return context.json({ error: 'forbidden' }, 403)

  const base = new URL(kpiloteApiUrlFor(session.environment))
  const basePath = base.pathname.replace(/\/$/, '')
  const url = new URL(`${basePath}/${subPath}`, base)
  if (query) url.search = query

  // Défense en profondeur : le path est déjà sanitizé (isSuspicious) et la query
  // ne peut pas changer d'origine, mais comme il n'y a aucune allowlist ici (les
  // appels arbitraires sont le but), on garde ce filet pour ne jamais relayer le
  // token vers une autre origine que l'environnement sélectionné.
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
  const upstream = await ky(url, {
    method,
    headers: forwarded,
    throwHttpErrors: false,
    retry: 0,
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
  const payload: ConsoleResponse = {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
    durationMs,
    body: responseBody,
  }
  return context.json(payload)
})
