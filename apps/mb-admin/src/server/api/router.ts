import { Hono } from 'hono'

import { mbApiUrlFor } from '@/server/environments'
import { readSession } from '@/server/session'

// Liste blanche des préfixes relayables (lecture + upsert indicateurs/référentiels).
const ALLOWED_PATHS = [/^indicateurs(\/.*)?$/, /^referentiels(\/.*)?$/, /^individus(\/.*)?$/]

const isAllowed = (path: string): boolean => ALLOWED_PATHS.some((re) => re.test(path))

export const apiRouter = new Hono()

apiRouter.all('/*', async (context) => {
  const session = await readSession(context)
  if (!session) return context.json({ error: 'unauthorized' }, 401)

  // chemin après /api/
  const subPath = context.req.path.replace(/^\/api\//, '')
  if (!isAllowed(subPath)) return context.json({ error: 'forbidden' }, 403)

  const url = new URL(`${mbApiUrlFor(session.environment)}/${subPath}`)
  url.search = new URL(context.req.url).search

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
