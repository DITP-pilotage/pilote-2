import { createMiddleware } from 'hono/factory'

import { type AuthenticatedUser, verifyAccessToken } from '@/authentication/jwks'
import { runWithUser } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'

const BEARER_REGEX = /^Bearer\s+(.+)$/i

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const match = BEARER_REGEX.exec(header)
  if (!match) return null
  const token = match[1]?.trim()
  return token && token.length > 0 ? token : null
}

const resolveUser = async (
  authorization: string | undefined,
): Promise<AuthenticatedUser | undefined> => {
  const token = extractBearerToken(authorization)
  if (!token) return undefined

  try {
    return await verifyAccessToken(token)
  } catch (error) {
    logger.warn(
      { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
      'JWT verification failed',
    )
    return undefined
  }
}

export const authContext = createMiddleware(async (context, next) => {
  const user = await resolveUser(context.req.header('Authorization'))
  await runWithUser(user, next)
})
