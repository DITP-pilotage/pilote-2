import { createMiddleware } from 'hono/factory'

import { verifyAccessToken } from '@/authentication/jwks'
import { getUtilisateurByProvider } from '@/authentication/queries/getUtilisateurByProvider'
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

const resolveUser = async (authorization: string | undefined) => {
  const token = extractBearerToken(authorization)
  if (!token) return null

  let verifiedTokenInfo
  try {
    verifiedTokenInfo = await verifyAccessToken(token)
  } catch (error) {
    logger.warn(
      { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
      'JWT verification failed',
    )
    return null
  }

  const utilisateur = await getUtilisateurByProvider(verifiedTokenInfo)
    .orTee((error) =>
      logger.warn(
        { event: 'auth.user.lookup_failed', err: error },
        'User lookup failed during authentication',
      ),
    )
    .unwrapOr(null)

  if (!utilisateur) return null

  return {
    ...utilisateur,
    prenom: verifiedTokenInfo.prenom,
    nom: verifiedTokenInfo.nom,
  }
}

export const authContext = createMiddleware(async (context, next) => {
  const user = await resolveUser(context.req.header('Authorization'))
  await runWithUser(user, next)
})
