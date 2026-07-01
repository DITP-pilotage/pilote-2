import { OpenAPIHono } from '@hono/zod-openapi'

import { authContext } from '@/framework/auth/authContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'

// App de test minimale : authContext (qui résout le principal via la base de la
// transaction de test) + les routes fournies + le mapping d'erreur standard. On
// n'inclut volontairement PAS databaseContext, qui écraserait le contexte db
// transactionnel d'integrationTest et rendrait les fixtures invisibles.
export const buildTestApp = (routes: OpenAPIHono) => {
  const app = new OpenAPIHono()
  app.use('*', authContext)
  app.route('/', routes)
  registerErrorHandler(app)
  return app
}
