import { createMiddleware } from 'hono/factory'
import { okAsync, ResultAsync } from 'neverthrow'

import { verifyAccessToken } from '@/authentication/jwks'
import { getUtilisateurByProvider } from '@/authentication/queries/getUtilisateurByProvider'
import { looksLikeApiKey, verifyApiKey } from '@/framework/auth/apiKey'
import { type Principal, runWithPrincipal } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'

const BEARER_REGEX = /^Bearer\s+(.+)$/i

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null
  const match = BEARER_REGEX.exec(header)
  if (!match) return null
  const token = match[1]?.trim()
  return token && token.length > 0 ? token : null
}

const resolveJwtPrincipal = (token: string): ResultAsync<Principal | null, unknown> =>
  ResultAsync.fromPromise(verifyAccessToken(token), (error) => error)
    .orTee((error) =>
      logger.warn(
        { event: 'auth.jwt.invalid', reason: error instanceof Error ? error.message : 'unknown' },
        'JWT verification failed',
      ),
    )
    .andThen((verifiedTokenInfo) =>
      getUtilisateurByProvider(verifiedTokenInfo)
        .map((utilisateur): Principal | null =>
          utilisateur
            ? {
                kind: 'user',
                user: {
                  ...utilisateur,
                  prenom: verifiedTokenInfo.prenom,
                  nom: verifiedTokenInfo.nom,
                },
              }
            : null,
        )
        .orTee((error) =>
          logger.warn(
            { event: 'auth.user.lookup_failed', err: error },
            'User lookup failed during authentication',
          ),
        ),
    )

const resolveApiKeyPrincipal = (token: string): ResultAsync<Principal | null, never> =>
  verifyApiKey(token).map((apiKey): Principal | null =>
    apiKey ? { kind: 'apiKey', apiKey } : null,
  )

const resolvePrincipal = (
  authorization: string | undefined,
): ResultAsync<Principal | null, unknown> => {
  const token = extractBearerToken(authorization)
  if (!token) return okAsync(null)
  if (looksLikeApiKey(token)) return resolveApiKeyPrincipal(token)
  return resolveJwtPrincipal(token)
}

export const authContext = createMiddleware(async (context, next) => {
  const principal = await resolvePrincipal(context.req.header('Authorization')).unwrapOr(null)
  await runWithPrincipal(principal, next)
})
