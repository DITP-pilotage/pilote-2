import { createMiddleware } from 'hono/factory'

import { type AuthenticatedUser, verifyAccessToken } from '@/authentication/jwks'
import { logger } from '@/framework/logger/logger'

export type AuthVariables = {
  user: AuthenticatedUser
}

const BEARER_REGEX = /^Bearer\s+(.+)$/i

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const match = BEARER_REGEX.exec(header)
  if (!match) return null
  const token = match[1]?.trim()
  return token && token.length > 0 ? token : null
}

export const requireUser = createMiddleware<{ Variables: AuthVariables }>(async (context, next) => {
  const token = extractBearerToken(context.req.header('Authorization'))

  if (!token) {
    logger.warn({ event: 'auth.jwt.missing' }, 'Missing or malformed Authorization header')
    return context.json({ error: 'unauthorized' }, 401)
  }

  try {
    const user = await verifyAccessToken(token)
    context.set('user', user)
    await next()
    return
  } catch (error) {
    logger.warn(
      { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
      'JWT verification failed',
    )
    return context.json({ error: 'unauthorized' }, 401)
  }
})
