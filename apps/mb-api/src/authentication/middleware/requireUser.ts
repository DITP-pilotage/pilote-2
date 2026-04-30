import { createMiddleware } from 'hono/factory'

import { type AuthenticatedUser, verifyAccessToken } from '@/authentication/jwks'

export type AuthVariables = {
  user: AuthenticatedUser
}

export const requireUser = createMiddleware<{ Variables: AuthVariables }>(async (context, next) => {
  const header = context.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null

  if (!token) {
    return context.json({ error: 'unauthorized' }, 401)
  }

  try {
    const user = await verifyAccessToken(token)
    context.set('user', user)
    await next()
    return
  } catch {
    return context.json({ error: 'unauthorized' }, 401)
  }
})
