import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { compress } from 'hono/compress'

const here = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(here, '..')
process.chdir(distDir)

const port = Number(process.env.PORT ?? 4000)

const app = new Hono()

app.use(compress())

app.get('/healthz', (c) => c.text('ok\n'))

app.use(
  '/assets/*',
  serveStatic({
    root: './client',
    onFound: (_path, c) => {
      c.header('Cache-Control', 'public, max-age=31536000, immutable')
    },
  }),
)

app.use(
  '/*',
  serveStatic({
    root: './client',
    onFound: (path, c) => {
      if (path.endsWith('.html')) {
        c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
    },
  }),
)

app.get(
  '*',
  serveStatic({
    path: './client/index.html',
    onFound: (_path, c) => {
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    },
  }),
)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`mb-webapp listening on http://localhost:${info.port}`)
})
