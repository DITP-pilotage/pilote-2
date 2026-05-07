import { createMiddleware } from 'hono/factory'

import { requirePrincipal } from '@/framework/auth/userContext'

export const requireAuthentication = createMiddleware(async (_context, next) => {
  requirePrincipal()
  await next()
})
