import { Hono } from 'hono'

import { kpiloteApiUrlFor } from '@/server/environments'
import { readSession } from '@/server/session'

// Ressources relayables (lecture + upsert indicateurs/référentiels/individus).
// Segments sûrs uniquement : une ressource autorisée, puis des segments composés
// de caractères de public id (alphanum, `_`, `-`). Tout le reste est rejeté.
const SAFE_PATH =
  /^(indicateurs|referentiels|individus|api-keys|utilisateurs|collections|permissions|features)(\/[A-Za-z0-9_-]+)*$/

// Rejette toute tentative de traversal / d'injection d'URL absolue AVANT de
// matcher l'allowlist (sinon la normalisation d'URL des `..` permettrait
// d'atteindre des endpoints hors périmètre).
const isSuspicious = (subPath: string): boolean =>
  subPath.includes('..') ||
  subPath.includes('//') ||
  subPath.includes('\\') ||
  subPath.startsWith('/') ||
  /%2e/i.test(subPath) ||
  /%2f/i.test(subPath)

export const apiRouter = new Hono()

apiRouter.all('/*', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  const subPath = context.req.path.replace(/^\/api\//, '')
  if (isSuspicious(subPath) || !SAFE_PATH.test(subPath)) {
    return context.json({ error: 'forbidden' }, 403)
  }

  const base = new URL(kpiloteApiUrlFor(session.environment))
  const basePath = base.pathname.replace(/\/$/, '')
  const url = new URL(`${basePath}/${subPath}`, base)
  url.search = new URL(context.req.url).search

  // Re-validation APRÈS normalisation : même origine, chemin toujours dans une
  // ressource autorisée. Défense en profondeur contre une normalisation
  // inattendue (`..`, encodage, etc.).
  if (url.origin !== base.origin) return context.json({ error: 'forbidden' }, 403)
  const resolvedSubPath = url.pathname.startsWith(`${basePath}/`)
    ? url.pathname.slice(basePath.length + 1)
    : ''
  if (!SAFE_PATH.test(resolvedSubPath)) return context.json({ error: 'forbidden' }, 403)

  const isBodyless = context.req.method === 'GET' || context.req.method === 'HEAD'
  const init: RequestInit = {
    method: context.req.method,
    headers: {
      Authorization: `Bearer ${session.apiKey}`,
      ...(isBodyless ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(isBodyless ? {} : { body: await context.req.text() }),
  }

  const upstream = await fetch(url, init)
  const headers = new Headers()
  const contentType = upstream.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  headers.set('Cache-Control', 'no-store')
  return new Response(upstream.body, { status: upstream.status, headers })
})
