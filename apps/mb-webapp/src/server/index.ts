import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { compress } from 'hono/compress'

import { app } from '@/server/app'
import { serverEnv } from '@/server/env'

const here = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(here, '..')
process.chdir(distDir)

app.use(compress())

app.use(
  '/assets/*',
  serveStatic({
    root: './client',
    onFound: (_path, context) => {
      context.header('Cache-Control', 'public, max-age=31536000, immutable')
    },
  }),
)

app.use(
  '/*',
  serveStatic({
    root: './client',
    onFound: (path, context) => {
      if (path.endsWith('.html')) {
        context.header('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
    },
  }),
)

app.get(
  '*',
  serveStatic({
    path: './client/index.html',
    onFound: (_path, context) => {
      context.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    },
  }),
)

serve({ fetch: app.fetch, port: serverEnv.PORT }, (info) => {
  console.log(`mb-webapp listening on http://localhost:${info.port}`)
})
