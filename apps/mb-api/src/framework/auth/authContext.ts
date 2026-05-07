import { createMiddleware } from 'hono/factory'
import { okAsync, ResultAsync } from 'neverthrow'

import { verifyAccessToken } from '@/authentication/jwks'
import { getUtilisateurByProvider } from '@/authentication/queries/getUtilisateurByProvider'
import { runWithUser, type UtilisateurAuthentifie } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'

const BEARER_REGEX = /^Bearer\s+(.+)$/i

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const match = BEARER_REGEX.exec(header)
  if (!match) return null
  const token = match[1]?.trim()
  return token && token.length > 0 ? token : null
}

const resolveUser = (
  authorization: string | undefined,
): ResultAsync<UtilisateurAuthentifie | null, unknown> => {
  const token = extractBearerToken(authorization)
  if (!token) return okAsync(null)

  return ResultAsync.fromPromise(verifyAccessToken(token), (error) => error)
    .orTee((error) =>
      logger.warn(
        { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
        'JWT verification failed',
      ),
    )
    .andThen((verifiedTokenInfo) =>
      getUtilisateurByProvider(verifiedTokenInfo)
        .map((utilisateur): UtilisateurAuthentifie | null =>
          utilisateur
            ? { ...utilisateur, prenom: verifiedTokenInfo.prenom, nom: verifiedTokenInfo.nom }
            : null,
        )
        .orTee((error) =>
          logger.warn(
            { event: 'auth.user.lookup_failed', err: error },
            'User lookup failed during authentication',
          ),
        ),
    )
}

export const authContext = createMiddleware(async (context, next) => {
  const user = await resolveUser(context.req.header('Authorization')).unwrapOr(null)
  await runWithUser(user, next)
})
