import { Hono } from 'hono'
import type { Context, MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import * as client from 'openid-client'

import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import ky, { HTTPError } from 'ky'

import { type Provider, getOidcConfig, providerSchema } from '@/server/auth/oidc'
import {
  clearPkce,
  clearSession,
  readLastProvider,
  readPkce,
  readSession,
  writeLastProvider,
  writePkce,
  writeSession,
} from '@/server/auth/session'
import { serverEnv } from '@/server/env'
import { logger } from '@/server/logger'

const SCOPES: Record<Provider, string> = {
  proconnect: 'openid given_name usual_name email uid',
  keycloak: 'openid profile email offline_access',
}

// ProConnect plafonne le refresh_token à 2h dur depuis la génération du token, sans rotation
// et sans champ `refresh_expires_in` dans la réponse token endpoint.
// Sources :
// - https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/refresh-token
// - https://github.com/proconnect-gouv/proconnect-documentation
// Vérifié empiriquement (cf. commentaire PIL-1637) : refresh_expires_in reçu = null,
// et le fingerprint du refresh_token ne change pas entre plusieurs appels successifs.
// Keycloak (dev) demande `offline_access` et supporte un refresh long, on garde 30 jours.
const SESSION_TTL_DEFAULTS_SECONDS: Record<Provider, number> = {
  proconnect: 60 * 60 * 2,
  keycloak: 60 * 60 * 24 * 30,
}
const ALLOWED_CALLBACK_PARAMS = ['code', 'state', 'iss', 'error', 'error_description'] as const
const PUBLIC_ORIGIN = new URL(serverEnv.PUBLIC_BASE_URL).origin

const sessionTtlSeconds = (provider: Provider, refreshExpiresIn: unknown): number => {
  const default_ = SESSION_TTL_DEFAULTS_SECONDS[provider]
  const value = Number(refreshExpiresIn)
  const idpValue = Number.isFinite(value) && value > 0 ? value : default_
  return Math.min(idpValue, default_)
}

const SAFE_INTERNAL_PATH = /^\/(?:[^/\\].*)?$/

const safeRedirectPath = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined
  if (raw.length > 512) return undefined
  return SAFE_INTERNAL_PATH.test(raw) ? raw : undefined
}

const sanitizeCallbackUrl = (incomingUrl: string): URL => {
  const parsed = new URL(incomingUrl)
  const target = new URL(serverEnv.OIDC_REDIRECT_URI)
  for (const key of ALLOWED_CALLBACK_PARAMS) {
    const value = parsed.searchParams.get(key)
    if (value !== null) target.searchParams.set(key, value)
  }
  return target
}

const assertSameOrigin = (context: Context): boolean => {
  const origin = context.req.header('origin')
  if (!origin || origin !== PUBLIC_ORIGIN) {
    logger.warn(
      { event: 'auth.origin.mismatch', received: origin ?? null },
      'Rejected cross-origin request on /auth endpoint',
    )
    return false
  }
  return true
}

const clientIp = (context: Context): string => {
  const forwarded = context.req.header('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }
  return context.req.header('x-real-ip') ?? 'unknown'
}

const buildLimiter = (limit: number): MiddlewareHandler =>
  rateLimiter({
    windowMs: 60 * 1000,
    limit,
    standardHeaders: 'draft-6',
    keyGenerator: clientIp,
  })

const loginLimiter = buildLimiter(10)
const refreshLimiter = buildLimiter(60)
const logoutLimiter = buildLimiter(30)

const checkUserProvisioned = (accessToken: string) =>
  ResultAsync.fromPromise(
    ky.get(`${serverEnv.API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      retry: 0,
      timeout: 5000,
    }),
    (error) => error,
  )
    .map(() => true)
    .orElse((error) =>
      error instanceof HTTPError && error.response.status === 401
        ? okAsync(false)
        : errAsync(error),
    )

export const authRouter = new Hono()

const resolveLoginProvider = (context: Context): Provider | null => {
  const queryProvider = context.req.query('provider')
  if (queryProvider !== undefined) {
    const parsed = providerSchema.safeParse(queryProvider)
    return parsed.success ? parsed.data : null
  }
  return readLastProvider(context)
}

authRouter.get('/login', loginLimiter, async (context) => {
  const redirectPath = safeRedirectPath(context.req.query('redirect'))
  const provider = resolveLoginProvider(context)

  if (!provider) {
    const target = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login'
    return context.redirect(target)
  }

  const config = await getOidcConfig(provider)
  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const state = client.randomState()
  const nonce = client.randomNonce()

  await writePkce(context, {
    codeVerifier,
    state,
    nonce,
    provider,
    ...(redirectPath ? { redirect: redirectPath } : {}),
  })

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: serverEnv.OIDC_REDIRECT_URI,
    scope: SCOPES[provider],
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  })

  logger.debug({ event: 'auth.login.start', provider }, 'Starting OIDC login')
  return context.redirect(authorizationUrl.toString())
})

authRouter.get('/callback', async (context) => {
  const pkce = await readPkce(context)
  if (!pkce) {
    logger.error({ event: 'auth.callback.no_pkce' }, 'Callback received without PKCE state')
    return context.redirect('/login-error?reason=invalid_state')
  }
  clearPkce(context)

  const config = await getOidcConfig(pkce.provider)
  const currentUrl = sanitizeCallbackUrl(context.req.url)

  let tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>
  try {
    tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: pkce.codeVerifier,
      expectedState: pkce.state,
      expectedNonce: pkce.nonce,
    })
  } catch (error) {
    logger.warn(
      { event: 'auth.callback.failed', reason: error instanceof Error ? error.message : 'unknown' },
      'OIDC code exchange failed',
    )
    return context.redirect('/login-error?reason=callback_failed')
  }

  const claims = tokens.claims()
  if (!claims?.sub || !tokens.refresh_token || !tokens.id_token) {
    logger.error(
      { event: 'auth.callback.missing_tokens' },
      'Missing claims, refresh token or id token',
    )
    return context.redirect('/login-error?reason=missing_tokens')
  }

  if (!tokens.access_token) {
    logger.error(
      { event: 'auth.callback.missing_access_token' },
      'Missing access token in OIDC response',
    )
    return context.redirect('/login-error?reason=missing_access_token')
  }

  const sub = claims.sub
  const refreshToken = tokens.refresh_token
  const accessToken = tokens.access_token
  const idToken = tokens.id_token

  return checkUserProvisioned(accessToken).match(
    async (provisioned) => {
      if (!provisioned) {
        logger.warn({ event: 'auth.login.user_not_found', sub }, 'PMB user not found')
        return context.redirect('/login-error?reason=user_not_found')
      }

      await writeSession(
        context,
        { refreshToken, sub, idToken, provider: pkce.provider },
        sessionTtlSeconds(pkce.provider, tokens.refresh_expires_in),
      )
      writeLastProvider(context, pkce.provider)

      logger.debug({ event: 'auth.login.success', provider: pkce.provider }, 'PMB login completed')

      const target = pkce.redirect
        ? new URL(pkce.redirect, serverEnv.PUBLIC_BASE_URL).toString()
        : serverEnv.PUBLIC_BASE_URL
      return context.redirect(target)
    },
    (error) => {
      logger.error(
        { event: 'auth.callback.me_failed', err: error },
        'Failed to verify user provisioning',
      )
      return context.redirect('/login-error?reason=me_failed')
    },
  )
})

authRouter.post('/refresh', refreshLimiter, async (context) => {
  if (!assertSameOrigin(context)) {
    return context.json({ error: 'forbidden' }, 403)
  }

  const session = await readSession(context)
  if (!session) {
    return context.json({ error: 'unauthorized' }, 401)
  }

  const config = await getOidcConfig(session.provider)
  let tokens: Awaited<ReturnType<typeof client.refreshTokenGrant>>
  try {
    tokens = await client.refreshTokenGrant(config, session.refreshToken)
  } catch (error) {
    logger.warn(
      { event: 'auth.refresh.failed', reason: error instanceof Error ? error.message : 'unknown' },
      'Refresh token grant failed',
    )
    clearSession(context)
    return context.json({ error: 'unauthorized' }, 401)
  }

  if (!tokens.access_token) {
    logger.error({ event: 'auth.refresh.no_access_token' }, 'Refresh response without access token')
    clearSession(context)
    return context.json({ error: 'unauthorized' }, 401)
  }

  await writeSession(
    context,
    {
      refreshToken: tokens.refresh_token ?? session.refreshToken,
      sub: session.sub,
      idToken: tokens.id_token ?? session.idToken,
      provider: session.provider,
    },
    sessionTtlSeconds(session.provider, tokens.refresh_expires_in),
  )

  logger.debug({ event: 'auth.refresh.success' }, 'Refresh succeeded')
  context.header('Cache-Control', 'no-store')
  return context.json({
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in ?? null,
  })
})

authRouter.post('/logout', logoutLimiter, async (context) => {
  if (!assertSameOrigin(context)) {
    return context.json({ error: 'forbidden' }, 403)
  }

  const session = await readSession(context)
  clearSession(context)

  if (!session) {
    return context.json({ logoutUrl: null })
  }

  const config = await getOidcConfig(session.provider)
  try {
    await client.tokenRevocation(config, session.refreshToken)
  } catch (error) {
    logger.warn(
      {
        event: 'auth.logout.revocation_failed',
        reason: error instanceof Error ? error.message : 'unknown',
      },
      'IdP token revocation failed (best effort)',
    )
  }

  const endSessionUrl = client.buildEndSessionUrl(config, {
    post_logout_redirect_uri: serverEnv.OIDC_POST_LOGOUT_REDIRECT_URI,
    id_token_hint: session.idToken,
    state: client.randomState(),
  })

  logger.debug({ event: 'auth.logout.success' }, 'User logged out')
  return context.json({ logoutUrl: endSessionUrl.toString() })
})
